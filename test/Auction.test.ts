/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";

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

describe("Test Auction", function () {
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
      BigInt(3 * 10 ** DECIMAL),
      3600 * 24,
      AuctionType.BID
    );

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

  it("SP1 bid for auction again", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1);

    // SP1 Bid again
    const bidAmount = BigInt(2 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BID);

    const sp1Balance = BigInt(97 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
    const sp1Bided = BigInt(3 * 10 ** DECIMAL);
    const res = await this.auction.bids(this.sp1.address)
    expect(res[0]).to.equal(sp1Bided)
  });

  it("end bidding", async function () {
    await expect(this.auction.connect(this.admin).endBidding()).to.emit(
      this.auction,
      "BiddingEnded"
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.SELECTION);
  });

  it("select sp1 bid by client", async function () {
    const sp1BidAmount = BigInt(3 * 10 ** DECIMAL);
    await expect(this.auction.selectBid(this.sp1.address))
      .to.emit(this.auction, "BidSelected")
      .withArgs(this.sp1.address, sp1BidAmount, 1);
  });

  it("end selection", async function () {
    await expect(this.auction.connect(this.admin).endSelection()).to.emit(
      this.auction,
      "SelectionEnded"
    );

    // refunded
    const sp2Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);

    // no refund
    const sp1Balance = BigInt(97 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);

    const auctionBalance = BigInt(3 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );
  });

  it("cancel auction when dealing", async function () {
    await expect(
      this.auction.cancelAuction()
    ).to.be.revertedWith("Auction not BIDDING/SELECTION");
  });

  it("set SP1 bid deal success and payout", async function () {
    const payoutAmount = BigInt(3 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address)
    )
      .to.emit(this.auction, "BidDealSuccessfulPaid")
      .withArgs(this.sp1.address, payoutAmount);

    const auctionBalance = BigInt(0 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );

    const clientBalance = BigInt(3 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.client.address)).to.equal(
      clientBalance
    );
  });
});
