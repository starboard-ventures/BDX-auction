/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import { AuctionState, BidState, AuctionType, BidType } from './_utils'
import { createAuction } from "./helper";
const DECIMAL = 18;

describe("No Selection Auction", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      type: AuctionType.BID,
    });
    this.admin = _admin;
    this.client = _client;
    this.sp1 = _sp1;
    this.sp2 = _sp2;
    this.sp3 = _sp3;
    this.mockFil = mockFil
    this.auction = auction;
  });

  it("SP2 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp2)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    // SP2 Bid
    const bidAmount = BigInt(2 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp2).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp2.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BID);

    const sp2Balance = BigInt(98 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);
  });

  it("SP1 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // const bidTime = parseInt(new Date().getTime().toFixed(10));
    // SP1 Bid
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BID);

    const sp1Balance = BigInt(99 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });

  it("SP3 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp3)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    // SP3 Bid
    const bidAmount = BigInt(3 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp3).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp3.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BID);

    const sp3Balance = BigInt(97 * 10 ** DECIMAL);

    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);
  });

  it("end bidding", async function () {
    await expect(this.auction.connect(this.admin).endBidding()).to.emit(
      this.auction,
      "BiddingEnded"
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.SELECTION);
  });

  it("end selection", async function () {
    await expect(this.auction.connect(this.admin).endSelection()).to.emit(
      this.auction,
      "SelectionEnded"
    );

    const sp2Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);

    // no refund
    const sp1Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);

    // no refund
    const sp3Balance = BigInt(97 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);

    const auctionBalance = BigInt(3 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );
  });

  it("set SP3 bid failure and refund", async function () {
    const refundAmount = BigInt(1 * 10 ** DECIMAL);
    const payoutAmount = BigInt(2 * 10 ** DECIMAL);
    await expect(
      this.auction
        .connect(this.admin)
        .setBidDealRefund(this.sp3.address, refundAmount)
    )
      .to.emit(this.auction, "BidDealUnsuccessfulRefund")
      .withArgs(this.sp3.address, refundAmount, payoutAmount);

    const auctionBalance = BigInt(0 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );

    const sp3Balance = BigInt(98 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);

    const clientBalance = BigInt(2 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.client.address)).to.equal(
      clientBalance
    );
  });
});
