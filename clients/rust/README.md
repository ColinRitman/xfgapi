# Fuego API Rust Client

Async Rust client for the Fuego API Gateway.

## Install

From this repo:
```bash
cd api/clients/rust
cargo build
```

## Usage

```rust
use fuego_api::{NodeClient, WalletClient, Destination};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let base = "http://127.0.0.1:8787/v1";

    let node = NodeClient::new(base)?;
    println!("health: {}", node.health().await?);
    println!("height: {}", node.get_height().await?);

    let wallet = WalletClient::new(base)?;
    println!("balance: {}", wallet.get_balance().await?);

    // Send example
    // let res = wallet.transfer(vec![Destination { address: "fire...".into(), amount: 1000000 }], None, Some(0), None, None, None).await?;
    // println!("tx: {}", res);

    Ok(())
}
```
