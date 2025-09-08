# Fuego Explorer API Integration

This guide shows how to integrate our Node.js API gateway into the existing Fuego Explorer.

## Overview

Replace the PHP backend with our modern Node.js API gateway while keeping the existing JavaScript frontend.

## Files to Replace

### 1. Replace `config.php` with our API gateway
```bash
# Remove PHP files
rm config.php funds.php

# Use our Node.js gateway instead
cp -r api/gateway/* explorer/
```

### 2. Update `config.js` to use our API endpoints
```javascript
// Old config.js (PHP endpoints)
const API_BASE = '/config.php';

// New config.js (Node.js endpoints)  
const API_BASE = 'http://localhost:8787/v1';
```

### 3. Update JavaScript API calls
```javascript
// Old (PHP)
fetch('/config.php', {
  method: 'POST',
  body: JSON.stringify({method: 'getinfo'})
})

// New (Our API)
fetch('http://localhost:8787/v1/node/info')
```

## Deployment Steps

1. **Install Node.js dependencies:**
```bash
cd explorer
npm install express body-parser node-fetch
```

2. **Start the API gateway:**
```bash
CORE_RPC_URL=http://127.0.0.1:18180 \
WALLET_RPC_URL=http://127.0.0.1:8070/json_rpc \
PORT=8787 \
node server.js
```

3. **Update explorer JavaScript files** to use new endpoints

4. **Configure web server** to proxy API requests to Node.js

## Benefits

- ✅ **Modern JavaScript stack**
- ✅ **Better performance** 
- ✅ **Consistent API** across tools
- ✅ **Easier maintenance**
- ✅ **Better error handling**

## Migration Checklist

- [ ] Replace PHP backend with Node.js gateway
- [ ] Update all JavaScript API calls
- [ ] Test all explorer functionality
- [ ] Update deployment scripts
- [ ] Update documentation
