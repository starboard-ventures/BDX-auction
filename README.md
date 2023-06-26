# Auction House

## Getting Started
Follow instructions for installation at [HardHat](https://hardhat.org/getting-started/#installation).

## Testing
Run the following commands to run the test suite.

    npx hardhat test

## Deployment to local hardhat
To deploy contracts to the local hardhat network will require first starting the network using:
    npx hardhat node

Subsequently, run the deployment commands without `--network` argument. Hardhat defaults to the local network.