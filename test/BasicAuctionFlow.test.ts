/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import { AuctionState, BidState, AuctionType, BidType } from './_utils'
const DECIMAL = 18;
import { createAuction } from "./helper";

describe("Basic Auction", function () {
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

  // beforeEach(async function () {

  // });

  it("create auction", async function () {

    expect(await this.auction.client()).to.equal(this.client.address);
    expect(await this.auction.admin()).to.equal(this.admin.address);
    expect(await this.auction.auctionState()).to.equal(AuctionState.BIDDING);
    expect(await this.auction.price()).to.equal(BigInt(5 * 10 ** DECIMAL));
  });

  it("SP1 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // SP1 Bid
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING, BidType.BID);

    const sp1Balance = BigInt(99 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
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
      .withArgs(this.sp2.address, bidAmount, BidState.BIDDING, BidType.BID);

    const sp2Balance = BigInt(98 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);
  });

  it("SP3 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp3)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    // SP3 Bid
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp3).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp3.address, bidAmount, BidState.BIDDING, BidType.BID);

    const sp3Balance = BigInt(99 * 10 ** DECIMAL);

    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);
  });

  // it("SP4 bid for auction", async function () {
  //   // Approve SPs wallet
  //   await this.mockFil
  //     .connect(this.sp4)
  //     .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

  //   // SP3 Bid
  //   const bidAmount = BigInt(2 * 10 ** DECIMAL);
  //   await expect(this.auction.connect(this.sp4).placeBid(bidAmount, BidType.BID))
  //     .to.emit(this.auction, "BidPlaced")
  //     .withArgs(this.sp4.address, bidAmount, BidState.BIDDING, BidType.BID);

  //   const sp4Balance = BigInt(98 * 10 ** DECIMAL);

  //   expect(await this.mockFil.balanceOf(this.sp4.address)).to.equal(sp4Balance);
  // });

  it("SP3 increased bid", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp3)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    // SP3 Bid
    const bidAmount = BigInt(2 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp3).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp3.address, bidAmount, BidState.BIDDING, BidType.BID);

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

  it("select sp1 and sp3 bid by client", async function () {
    const sp1BidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.client).selectBid(this.sp1.address))
      .to.emit(this.auction, "BidSelected")
      .withArgs(this.sp1.address, sp1BidAmount);
  });


  it("cancel auction when dealing", async function () {
    await expect(
      this.auction.connect(this.client).cancelAuction()
    ).to.be.revertedWith("Auction not BIDDING/SELECTION");
  });

  it("set SP1 bid deal success and payout", async function () {
    const payoutAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.admin).setBidDealSuccess(this.sp1.address, payoutAmount)
    )
      .to.emit(this.auction, "BidDealSuccessfulPaid")
      .withArgs(this.sp1.address, payoutAmount, true);

    const auctionBalance = BigInt(0 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );

    const clientBalance = BigInt(1 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.client.address)).to.equal(
      clientBalance
    );
  });
});
