/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import { AuctionState, BidState, AuctionType, BidType} from './_utils'
import { createAuction } from "./helper";
const DECIMAL = 18;


describe("Cancel Auction", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      minPrice: 0.5,
      fixedPrice: 2,
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
      .withArgs(this.sp2.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BOTH);

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
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING,BidType.BID, AuctionType.BOTH);

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
      .withArgs(this.sp3.address, bidAmount, BidState.BIDDING,BidType.BID, AuctionType.BOTH);

    const sp3Balance = BigInt(97 * 10 ** DECIMAL);

    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);
  });

  it("cancel auction when bidding", async function () {
    await expect(this.auction.connect(this.client).cancelAuction()).to.emit(
      this.auction,
      "AuctionCancelled"
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.CANCELLED);

    // refunded
    const sp2Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);

    const sp1Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);

    const sp3Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);

    const auctionBalance = BigInt(0 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );
  });

  it("create auction", async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      minPrice: 0.5,
      fixedPrice: 2,
      type: AuctionType.BOTH
    });
    this.admin = _admin;
    this.client = _client;
    this.sp1 = _sp1;
    this.sp2 = _sp2;
    this.sp3 = _sp3;
    this.mockFil = mockFil
    this.auction = auction;
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
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING,BidType.BID, AuctionType.BOTH);

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
    await expect(this.auction.connect(this.sp3).placeBid(bidAmount,  BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp3.address, bidAmount, BidState.BIDDING,BidType.BID, AuctionType.BOTH);

    const sp3Balance = BigInt(97 * 10 ** DECIMAL);

    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);
  });

  it("cancel auction when selection", async function () {
    await expect(this.auction.connect(this.client).cancelAuction()).to.emit(
      this.auction,
      "AuctionCancelled"
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.CANCELLED);

    // refunded
    const sp2Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);

    const sp1Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);

    const sp3Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);

    const auctionBalance = BigInt(0 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );
  });
});
