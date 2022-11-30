/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import BN from 'bignumber.js'
import { BigNumber } from "ethers";
const DECIMAL = 18;

enum AuctionType {
  BID,
  FIXED,
  BOTH
}

enum BidType {
  BID,
  BUY_NOW
}

enum AuctionState {
  BIDDING,
  NO_BID_CANCELLED,
  SELECTION,
  VERIFICATION,
  CANCELLED,
  COMPLETED,
}

enum BidState {
  BIDDING,
  PENDING_SELECTION,
  SELECTED,
  REFUNDED,
  CANCELLED,
  DEAL_SUCCESSFUL_PAID,
  DEAL_UNSUCCESSFUL_REFUNDED,
}

describe("Test Auction BigNumber", function () {
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
    const seedAmount = BigInt(5000 * 10 ** DECIMAL);
    await this.mockFil
      .connect(this.admin)
      .transfer(this.sp1.address, seedAmount);
    await this.mockFil
      .connect(this.admin)
      .transfer(this.sp2.address, seedAmount);
    await this.mockFil
      .connect(this.admin)
      .transfer(this.sp3.address, seedAmount);

    this.Auction = await ethers.getContractFactory("Auction");
    // _paymentToken,
    // _minPrice,
    // _noOfCopies,
    // _client,
    // _admin,
    // _fixedPrice,
    // _biddingTime,
    // _type
    this.auction = await this.Auction.deploy(
      this.mockFil.address,
      BigInt(1 * 10 ** DECIMAL),
      1,
      this.client.address,
      this.admin.address,
      web3.utils.toWei('3117', 'ether'),
      3600 * 24,
      AuctionType.BOTH,
    );

  });

  it("SP1 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // const bidTime = parseInt(new Date().getTime().toFixed(10));
    // SP1 Bid
    const bidAmount =  web3.utils.toWei('3117', 'ether');
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BUY_NOW))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.SELECTED, BidType.BUY_NOW, AuctionType.BOTH);

    const sp1Balance =  web3.utils.toWei('1883', 'ether');
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });
});
