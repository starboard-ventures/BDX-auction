// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

const DECIMAL = 18;

async function approveRenFil(
  tokenAddress: string,
  amount: any,
  signer: any,
  spenderAddress: string
) {
  // RENFIL Approval
  const abi = [
    "function approve(address _spender, uint256 _value) public returns (bool success)",
  ];

  const contract = new ethers.Contract(tokenAddress, abi, signer);
  const txn = await contract.approve(spenderAddress, amount);
  console.log(txn);
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // // We get the contract to deploy
  const [admin, client, sp1] = await ethers.getSigners();
  console.log('Admin address is:', admin.address)
  const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
  const auctionFactory = await AuctionFactory.deploy(admin.address);
  // const MOCKFILADDR = ethers.utils.getAddress(
  //   "0xfb482fad22dc89fc0677ea8ad171313dff99ce9f"
  // );

  // const RENFILADDR = ethers.utils.getAddress(
  //   "0xc4Ace9278e7E01755B670C0838c3106367639962"
  // );

  await auctionFactory.deployed();

  // const deployedAuction = await auctionFactory.createAuction(
  //   RENFILADDR,
  //   // eslint-disable-next-line node/no-unsupported-features/es-builtins
  //   BigInt(0.1 * 10 ** 18),
  //   1,
  //   client.address,
  //   admin.address,
  //   BigInt(0.1 * 10 ** 18),
  //   36000,
  //   1
  // );

  // const receipt = await deployedAuction.wait();
  // const auctionEvents = receipt?.events?.filter((x) => {
  //   return x.event === "AuctionCreated";
  // });

  // const auctionAddress = auctionEvents?.[0].args?.[0] ?? "";

  console.log("Auction Factory deployed to: ", auctionFactory.address);
  // console.log("Auction deployed to: ", auctionAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
