const fetch = require('node-fetch');

class BaseClient {
  constructor({ baseUrl }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  async get(path) {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  async post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

class FuegoNodeClient extends BaseClient {
  getInfo() { return this.get('/node/info'); }
  getHeight() { return this.get('/node/height'); }
  getBlockCount() { return this.get('/node/blockcount'); }
  getLastBlockHeader() { return this.get('/node/last_block_header'); }
  getBlockHeaderByHeight(height) { return this.get(`/node/block_header_by_height/${height}`); }
}

class FuegoWalletClient extends BaseClient {
  getBalance() { return this.get('/wallet/balance'); }
  getHeight() { return this.get('/wallet/height'); }
  getTransfers(filter) { return this.post('/wallet/transfers', filter); }
  transfer(req) { return this.post('/wallet/transfer', req); }
  optimize(req) { return this.post('/wallet/optimize', req); }
}

module.exports = { FuegoNodeClient, FuegoWalletClient };
