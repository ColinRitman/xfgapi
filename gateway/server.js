const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8787;
const CORE_RPC_URL = process.env.CORE_RPC_URL || 'http://127.0.0.1:8181';
const WALLET_RPC_URL = process.env.WALLET_RPC_URL || 'http://127.0.0.1:8070/json_rpc';
const WALLET_RPC_USER = process.env.WALLET_RPC_USER || '';
const WALLET_RPC_PASSWORD = process.env.WALLET_RPC_PASSWORD || '';

const app = express();
app.use(bodyParser.json());

function walletHeaders() {
  if (WALLET_RPC_USER || WALLET_RPC_PASSWORD) {
    const token = Buffer.from(`${WALLET_RPC_USER}:${WALLET_RPC_PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

// Helper for core JSON-RPC via /json_rpc
async function coreJsonRpc(method, params = {}) {
  const res = await fetch(`${CORE_RPC_URL}/json_rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const data = await res.json();
  if (data.error) {
    const err = new Error(data.error.message || 'Core RPC error');
    err.code = data.error.code;
    throw err;
  }
  return data.result;
}

// Helper for wallet JSON-RPC
async function walletJsonRpc(method, params = {}) {
  const res = await fetch(WALLET_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...walletHeaders() },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const data = await res.json();
  if (data.error) {
    const err = new Error(data.error.message || 'Wallet RPC error');
    err.code = data.error.code;
    throw err;
  }
  return data.result;
}

// Health
app.get('/v1/health', (req, res) => res.json({ ok: true }));

// Core: info (maps to /getinfo)
app.get('/v1/node/info', async (req, res) => {
  try {
    const r = await fetch(`${CORE_RPC_URL}/getinfo`, { method: 'POST' });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Core: height (maps to /getheight)
app.get('/v1/node/height', async (req, res) => {
  try {
    const r = await fetch(`${CORE_RPC_URL}/getheight`, { method: 'POST' });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Core: getblockcount (json_rpc)
app.get('/v1/node/blockcount', async (req, res) => {
  try {
    const result = await coreJsonRpc('getblockcount');
    res.json(result);
  } catch (e) { res.status(502).json({ error: e.message, code: e.code }); }
});

// Core: last block header
app.get('/v1/node/last_block_header', async (req, res) => {
  try {
    const result = await coreJsonRpc('getlastblockheader');
    res.json(result);
  } catch (e) { res.status(502).json({ error: e.message, code: e.code }); }
});

// Core: block header by height
app.get('/v1/node/block_header_by_height/:height', async (req, res) => {
  try {
    const height = Number(req.params.height);
    const result = await coreJsonRpc('getblockheaderbyheight', { height });
    res.json(result);
  } catch (e) { res.status(502).json({ error: e.message, code: e.code }); }
});

// Wallet: balance
app.get('/v1/wallet/balance', async (req, res) => {
  try {
    const result = await walletJsonRpc('getbalance');
    res.json(result);
  } catch (e) { res.status(502).json({ error: e.message, code: e.code }); }
});

// Wallet: height
app.get('/v1/wallet/height', async (req, res) => {
  try {
    const result = await walletJsonRpc('get_height');
    res.json(result);
  } catch (e) { res.status(502).json({ error: e.message, code: e.code }); }
});

// Wallet: transfers
app.post('/v1/wallet/transfers', async (req, res) => {
  try {
    const result = await walletJsonRpc('get_transfers', req.body || {});
    res.json(result);
  } catch (e) { res.status(502).json({ error: e.message, code: e.code }); }
});

// Wallet: transfer (send)
app.post('/v1/wallet/transfer', async (req, res) => {
  try {
    const result = await walletJsonRpc('transfer', req.body || {});
    res.json(result);
  } catch (e) { res.status(502).json({ error: e.message, code: e.code }); }
});

// Wallet: optimize
app.post('/v1/wallet/optimize', async (req, res) => {
  try { res.json(await walletJsonRpc('optimize', req.body || {})); }
  catch (e) { res.status(502).json({ error: e.message, code: e.code }); }
});

app.listen(PORT, () => {
  console.log(`Fuego API gateway listening on http://localhost:${PORT}`);
});
