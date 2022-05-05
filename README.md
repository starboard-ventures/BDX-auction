# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

Deploy Factory + Create Auction
hh run scripts/deploy.ts --network mumbai

Verify Auction Contract
hh verify --network mumbai 0xa5fd23Dc7a0eb9FC89860B7B0826631B1508E8f7 0xfb482fad22dc89fc0677ea8ad171313dff99ce9f 1000000000000000000 1 0x10c07Bd759c5a7f54a8e92D3D4a572cB1E1d7f5f 0x441ed2991406aeF4B68D79bBCe5955D1e76CbfA4

hh verify --network mainnet 0x04f4F7067c005B59a6a2584b67D57F364870b385 0xc4Ace9278e7E01755B670C0838c3106367639962 100000000000000000 1 0x10c07Bd759c5a7f54a8e92D3D4a572cB1E1d7f5f 0x441ed2991406aeF4B68D79bBCe5955D1e76CbfA4

Verify Auction Factory
hh verify --network mumbai 0xd5b6164Dbf273df9f458c86D6a03309c53c73001 0x441ed2991406aeF4B68D79bBCe5955D1e76CbfA4

hh verify --network mainnet 0xb612a76c8bCEac3E3f5DfBDd4D916a0625Cf4933 0x441ed2991406aeF4B68D79bBCe5955D1e76CbfA4

Verify token
hh verify --network mumbai 0xfb482FAd22dC89FC0677ea8Ad171313Dff99Ce9F 100000000000000000000000

MockFil Address
0xfb482FAd22dC89FC0677ea8Ad171313Dff99Ce9F