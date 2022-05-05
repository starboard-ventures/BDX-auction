# Auction House

## Getting Started
Follow instructions for installation at [HardHat](https://hardhat.org/getting-started/#installation).

This project uses Hardhat shorthand for commands. Install it using `npm i -g hardhat-shorthand`

## Deployment
To deploy the contract to Polygon Mumbai testnet use the following command. This deploys the `AuctionFactory` and a sample `Auction Contract` to the testnet. For deployment to mainnet, use `--network mainnet` instead.

    hh run scripts/deploy.ts --network mumbai

The resultant contract addresses will be printed out.

In order to interact with the contract through polygon scan, we'll need to run the etherscan verification through hardhat. The verification would require the parameters passed to the contract during deployment.

Verifying the `Auction Contract`, the parameters after the contract address are the ones used in the constructor during contract deployment.

    hh verify --network mumbai <Auction Contract Address> <Payment Token Address> <Min Price> <No of Copies> <Client Address> <Admin Address>

Verifying the `AuctionFactory Contract`

    hh verify --network mumbai <AuctionFactory Contract Address> <Admin Address>

Verifying the `MockFIL token contract`

    hh verify --network mumbai <Token Address> <Initial Supply>

## Testing
Run the following commands to run the test suite.

    hh test

## Deployment to local hardhat
To deploy contracts to the local hardhat network will require first starting the network using:
    hh node

Subsequently, run the deployment commands without `--network` argument. Hardhat defaults to the local network.