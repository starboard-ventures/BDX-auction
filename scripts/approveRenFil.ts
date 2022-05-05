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
  const [admin, client, sp1] = await ethers.getSigners();
  const RENFILADDR = ethers.utils.getAddress(
    "0xc4Ace9278e7E01755B670C0838c3106367639962"
  );
  const AUCTIONCONTRACTADDR = "0x04f4F7067c005B59a6a2584b67D57F364870b385";

  await approveRenFil(
    RENFILADDR,
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    BigInt(10000000000000 * 10 ** DECIMAL),
    sp1,
    AUCTIONCONTRACTADDR
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
