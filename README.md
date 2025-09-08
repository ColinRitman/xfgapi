## Fuego API Suite

- OpenAPI REST layer over the Fuego Network and Wallet RPCs
- Node.js gateway that translates REST calls to Fuego RPC endpoints
- Javascript, Rust, Python, Go, Ruby, PHP, Kotlin, & Swift5 clients for easy integration

### Overview

- Gateway REST base: `http://localhost:8787/v1`
- Underlying services:
  - Core RPC: `CORE_RPC_URL` (default `http://127.0.0.1:8181`)
  - Wallet RPC: `WALLET_RPC_URL` (default `http://127.0.0.1:8070`)
  - Wallet auth (optional): `WALLET_RPC_USER`, `WALLET_RPC_PASSWORD`

### Quick start

1) Start fuegod and Wallet RPC servers locally.

2) Start the gateway:

```bash
cd api/gateway
npm install
CORE_RPC_URL=http://127.0.0.1:8181 \
WALLET_RPC_URL=http://127.0.0.1:8070 \
WALLET_RPC_USER=rpcuser \
WALLET_RPC_PASSWORD=rpcpass \
PORT=8787 \
node server.js
```

3) Try requests:

- Node info
```bash
curl http://localhost:8787/v1/node/info
```

- Node height
```bash
curl http://localhost:8787/v1/node/height
```

- Wallet balance
```bash
curl http://localhost:8787/v1/wallet/balance
```

- Wallet transfer
```bash
curl -X POST http://localhost:8787/v1/wallet/transfer \
  -H 'Content-Type: application/json' \
  -d '{
    "destinations": [{"address": "fire...", "amount": 1000000}],
    "payment_id": "",
    "mixin": 0,
    "unlock_time": 0,
    "messages": [],
    "ttl": 0
  }'
```

### OpenAPI Spec

See `api/openapi/fuego-openapi.yaml`. You can import this into Postman, Insomnia, or Swagger UI.

### JavaScript Client (Node/Browser)

```bash
cd api/clients/javascript
npm install
```

Usage:
```javascript
const { FuegoNodeClient, FuegoWalletClient } = require('./');

const node = new FuegoNodeClient({ baseUrl: 'http://localhost:8787/v1' });
const wallet = new FuegoWalletClient({ baseUrl: 'http://localhost:8787/v1' });

(async () => {
  console.log(await node.getInfo());
  console.log(await wallet.getBalance());
})();
```

### Python Client

```bash
pip install requests
```

Usage:
```python
from fuego_api import NodeClient, WalletClient

node = NodeClient(base_url='http://localhost:8787/v1')
wallet = WalletClient(base_url='http://localhost:8787/v1')

print(node.get_info())
print(wallet.get_balance())
```

### Notes

- The gateway simply forwards to the underlying Core/Wallet RPC servers and normalizes responses and errors.
- For production, place the gateway behind your API gateway or reverse proxy (e.g., NGINX, Traefik) and configure TLS & auth as needed.
