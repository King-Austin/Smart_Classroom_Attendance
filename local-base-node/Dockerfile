# Use an official Foundry image, which contains Anvil (a hyper-fast local EVM node)
FROM ghcr.io/foundry-rs/foundry:latest

# Expose the standard EVM JSON-RPC port
EXPOSE 8545

# Anvil by default listens on 127.0.0.1, we must explicitly tell it to listen on 0.0.0.0 for Docker routing
# This base image entrypoint allows us to just pass anvil arguments
ENTRYPOINT ["anvil", "--host", "0.0.0.0"]

# Note: To fork Base Mainnet directly, you would append: "--fork-url", "https://mainnet.base.org"
