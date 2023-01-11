/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import { AuctionState, BidState, AuctionType, BidType } from './_utils'
const DECIMAL = 18;
function delay() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}
describe("No Bid Auction", function () {
  before(async function () {
    const [_admin, _client, _sp1, _sp2, _sp3] = await ethers.getSigners();
    this.admin = _admin;
    this.client = _client;
    this.sp1 = _sp1;
    this.sp2 = _sp2;
    this.sp3 = _sp3;
    this.MockFil = await ethers.getContractFactory("MockFil");

    this.mockFil = await this.MockFil.deploy(BigInt(100000 * 10 ** DECIMAL));
    await this.mockFil.deployed();

    // Seed sps with funds
    const seedAmount = BigInt(100 * 10 ** DECIMAL);
    await this.mockFil
      .connect(this.admin)
      .transfer(this.sp1.address, seedAmount);
    await this.mockFil
      .connect(this.admin)
      .transfer(this.sp2.address, seedAmount);
    await this.mockFil
      .connect(this.admin)
      .transfer(this.sp3.address, seedAmount);
 
    this.AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    this.auctionFactory = await this.AuctionFactory.deploy(this.admin.address);

    this.Auction = await ethers.getContractFactory("Auction");
  });

  // beforeEach(async function () {

  // });

  it("create auction", async function () {
    const deployedAuction = await this.auctionFactory.createAuction(
      this.mockFil.address,
      BigInt(0.5 * 10 ** DECIMAL),
      this.client.address,
      this.admin.address,
      web3.utils.toWei('10', 'ether'),
      1,
      AuctionType.BID
    );

    const receipt = await deployedAuction.wait();
    const auctionAddress = receipt.events?.filter((x: { event: string }) => {
      return x.event === "AuctionCreated";
    })[0].args[0];

    expect((await this.auctionFactory.getAuctions())[0]).to.equal(
      auctionAddress
    );

    this.auction = await this.Auction.attach(auctionAddress);

    expect(await this.auction.client()).to.equal(this.client.address);
    expect(await this.auction.admin()).to.equal(this.admin.address);
    expect(await this.auction.auctionState()).to.equal(AuctionState.BIDDING);
    expect(await this.auction.minPrice()).to.equal(BigInt(0.5 * 10 ** DECIMAL));
    expect(await this.auction.noOfCopies()).to.equal(2);
  });

  it("No bid Cancel", async function () {
    await delay();
    await expect(this.auction.connect(this.admin).endBidding()).to.emit(
      this.auction,
      "AuctionCancelledNoBids"
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.NO_BID_CANCELLED);
  });
});