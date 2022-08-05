import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
const { setGlobalDispatcher, ProxyAgent } = require("undici");
// import "hardhat-contract-sizer"
dotenv.config();

console.log(process.env.HTTPS_PROXY);
const proxyAgent = new ProxyAgent(process.env.HTTPS_PROXY!);
setGlobalDispatcher(proxyAgent);


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: { version: "0.8.7", settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  } },
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      accounts: [process.env.TEST_PRIVATE || '']
    },
    mumbai: {
      url: process.env.MUMBAI_URL,
      //   accounts: {
      //     mnemonic: process.env.MNEMONIC_TEST,
      //   },
      accounts: [process.env.ADMIN_PRIVATE || ''],
    },
    mainnet: {
      url: process.env.MAINNET_URL || "",
      accounts: [process.env.ADMIN_PRIVATE || ''],
    },
  },
  // contractSizer: {
  //   alphaSort: true,
  //   runOnCompile: true,
  //   disambiguatePaths: false,
  //   except: ['AuctionFactory']
  // },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGON_API!
    },
  },
};

export default config;
