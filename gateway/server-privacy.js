const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const PORT = process.env.PORT || 8787;
const CORE_RPC_URL = process.env.CORE_RPC_URL || 'http://127.0.0.1:8181';
const WALLET_RPC_URL = process.env.WALLET_RPC_URL || 'http://127.0.0.1:8070/json_rpc';
const WALLET_RPC_USER = process.env.WALLET_RPC_USER || '';
const WALLET_RPC_PASSWORD = process.env.WALLET_RPC_PASSWORD || '';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Stricter rate limiting for wallet endpoints
const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 wallet requests per windowMs
  message: {
    error: 'Too many wallet requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
});

app.use(bodyParser.json({ limit: '1mb' }));

// Privacy-aware logging
const logger = {
  info: (msg, data = {}) => {
    const sanitized = { ...data };
    // Remove sensitive data from logs
    delete sanitized.password;
    delete sanitized.private_key;
    delete sanitized.seed;
    delete sanitized.spend_key;
    delete sanitized.view_key;
    console.log(`[INFO] ${msg}`, sanitized);
  },
  error: (msg, error) => {
    // Don't log sensitive error details
    console.error(`[ERROR] ${msg}`, {
      message: error.message,
      code: error.code,
      // Don't log stack traces in production
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Authentication middleware for wallet endpoints
const walletAuth = (req, res, next) => {
  if (!WALLET_RPC_USER || !WALLET_RPC_PASSWORD) {
    return res.status(500).json({ error: 'Wallet authentication not configured' });
  }

  const auth = req.headers.authorization;
  const expectedAuth = `Basic ${Buffer.from(`${WALLET_RPC_USER}:${WALLET_RPC_PASSWORD}`).toString('base64')}`;
  
  if (!auth || auth !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Input validation middleware
const validateHeight = (req, res, next) => {
  const height = parseInt(req.params.height);
  if (isNaN(height) || height < 0) {
    return res.status(400).json({ error: 'Invalid height parameter' });
  }
  next();
};

// Helper functions with privacy considerations
async function coreJsonRpc(method, params = {}) {
  try {
    const response = await fetch(`${CORE_RPC_URL}/json_rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: method,
        params: params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    logger.error(`Core RPC call failed: ${method}`, error);
    throw error;
  }
}

async function walletJsonRpc(method, params = {}) {
  try {
    const auth = Buffer.from(`${WALLET_RPC_USER}:${WALLET_RPC_PASSWORD}`).toString('base64');
    
    const response = await fetch(WALLET_RPC_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: method,
        params: params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    logger.error(`Wallet RPC call failed: ${method}`, error);
    throw error;
  }
}

// Health check (public)
app.get('/v1/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Public node endpoints (no auth required)
app.get('/v1/node/info', async (req, res) => {
  try {
    const info = await coreJsonRpc('getinfo');
    
    // Data minimization - only return public, non-sensitive data
    res.json({
      height: info.height,
      difficulty: info.difficulty,
      tx_count: info.tx_count,
      alt_blocks_count: info.alt_blocks_count,
      outgoing_connections_count: info.outgoing_connections_count,
      white_peerlist_size: info.white_peerlist_size,
      grey_peerlist_size: info.grey_peerlist_size,
      // Don't expose: peer_id, incoming_connections_count, version, etc.
    });
  } catch (error) {
    logger.error('Failed to get node info', error);
    res.status(500).json({ error: 'Failed to get node information' });
  }
});

app.get('/v1/node/height', async (req, res) => {
  try {
    const height = await coreJsonRpc('getheight');
    res.json({ height: height.height });
  } catch (error) {
    logger.error('Failed to get node height', error);
    res.status(500).json({ error: 'Failed to get node height' });
  }
});

app.get('/v1/node/blockcount', async (req, res) => {
  try {
    const count = await coreJsonRpc('getblockcount');
    res.json({ count: count.count });
  } catch (error) {
    logger.error('Failed to get block count', error);
    res.status(500).json({ error: 'Failed to get block count' });
  }
});

app.get('/v1/node/last_block_header', async (req, res) => {
  try {
    const header = await coreJsonRpc('getlastblockheader');
    res.json(header);
  } catch (error) {
    logger.error('Failed to get last block header', error);
    res.status(500).json({ error: 'Failed to get last block header' });
  }
});

// Semi-private endpoint (rate limited, but no auth)
app.get('/v1/node/block_header_by_height/:height', validateHeight, async (req, res) => {
  try {
    const header = await coreJsonRpc('getblockheaderbyheight', { height: parseInt(req.params.height) });
    res.json(header);
  } catch (error) {
    logger.error('Failed to get block header by height', error);
    res.status(500).json({ error: 'Failed to get block header' });
  }
});

// Private wallet endpoints (require authentication)
app.get('/v1/wallet/balance', walletAuth, walletLimiter, async (req, res) => {
  try {
    const balance = await walletJsonRpc('getbalance');
    res.json(balance);
  } catch (error) {
    logger.error('Failed to get wallet balance', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

app.get('/v1/wallet/height', walletAuth, walletLimiter, async (req, res) => {
  try {
    const height = await walletJsonRpc('get_height');
    res.json({ height: height.height });
  } catch (error) {
    logger.error('Failed to get wallet height', error);
    res.status(500).json({ error: 'Failed to get wallet height' });
  }
});

app.post('/v1/wallet/transfers', walletAuth, walletLimiter, async (req, res) => {
  try {
    const transfers = await walletJsonRpc('get_transfers', req.body);
    res.json(transfers);
  } catch (error) {
    logger.error('Failed to get transfers', error);
    res.status(500).json({ error: 'Failed to get transfers' });
  }
});

app.post('/v1/wallet/transfer', walletAuth, walletLimiter, async (req, res) => {
  try {
    // Validate transfer request
    const { destinations, payment_id, mixin, unlock_time } = req.body;
    
    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ error: 'Invalid destinations array' });
    }
    
    // Validate each destination
    for (const dest of destinations) {
      if (!dest.address || !dest.amount) {
        return res.status(400).json({ error: 'Each destination must have address and amount' });
      }
      if (dest.amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }
    }
    
    const transfer = await walletJsonRpc('transfer', req.body);
    res.json(transfer);
  } catch (error) {
    logger.error('Failed to create transfer', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

app.post('/v1/wallet/optimize', walletAuth, walletLimiter, async (req, res) => {
  try {
    const result = await walletJsonRpc('optimize', req.body);
    res.json(result);
  } catch (error) {
    logger.error('Failed to optimize wallet', error);
    res.status(500).json({ error: 'Failed to optimize wallet' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  logger.info(`Fuego API gateway (privacy-enhanced) listening on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Rate limiting: 100 requests/15min (general), 10 requests/15min (wallet)`);
});
