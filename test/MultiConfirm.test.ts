/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionType, BidType, AuctionState, BidState } from './_utils'
const DECIMAL = 18;

/**
 * 1. bid with fixed price 3 FIL
 * 2. confirm 1 FIL
 * 3. confirm the rest of 2 FIL
 * 4. auction completed
 */

describe("Test Auction Multi confirm", function () {
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
    /**
     * _paymentToken,
     * _minPrice,
     * _noOfCopies,
     * _client,
     * _admin,
     * _fixedPrice,
     * _biddingTime,
     * _type
     */

    this.auction = await this.Auction.deploy(
      this.mockFil.address,
      BigInt(1 * 10 ** DECIMAL),
      this.client.address,
      this.admin.address,
      BigInt(3 * 10 ** DECIMAL),
      3600 * 24,
      AuctionType.FIXED,
    );
  });

  it("SP1 bid wrong type for fixed auciton", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // SP1 Bid
    const bidAmount = BigInt(3 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID))
    .to.be.revertedWith("bidType not right")
  });

  it("SP1 bid wrong price for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // SP1 Bid
    const bidAmount = BigInt(4 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BUY_NOW))
      .to.be.revertedWith('Price not right')
  });

  // first 3 FIL bid of SP1
  it("SP1 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // SP1 Bid
    const bidAmount = BigInt(3 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BUY_NOW))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.SELECTED, BidType.BUY_NOW, AuctionType.FIXED);

    const sp1Balance = BigInt(97 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });

  it("set SP1 bid deal success first 3 FIL", async function () {
    const payoutAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, payoutAmount)
    )
      .to.emit(this.auction, "BidDealSuccessfulPaid")
      .withArgs(this.sp1.address, payoutAmount, false);

    const auctionBalance = BigInt(2 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );

    const clientBalance = BigInt(1 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.client.address)).to.equal(
      clientBalance
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.DEAL_MAKING);
  });

  it("set SP1 bid incorrect value", async function () {
    const payoutAmount = BigInt(4 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, payoutAmount)
    ).to.be.revertedWith("Not enough value");
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, 0)
    ).to.be.revertedWith("Confirm <= 0");

  });

  it("set SP1 bid deal success rest 2 FIL", async function () {
    const payoutAmount2th = BigInt(2 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, payoutAmount2th)
    )
      .to.emit(this.auction, "BidDealSuccessfulPaid")
      .withArgs(this.sp1.address, payoutAmount2th, true);

      expect(await this.auction.auctionState()).to.equal(AuctionState.COMPLETED);

  });
});

describe("Test BOTH Auction Multi confirm", function () {
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
    /**
     * _paymentToken,
     * _minPrice,
     * _noOfCopies,
     * _client,
     * _admin,
     * _fixedPrice,
     * _biddingTime,
     * _type
     */

    this.auction = await this.Auction.deploy(
      this.mockFil.address,
      BigInt(1 * 10 ** DECIMAL),
      this.client.address,
      this.admin.address,
      BigInt(3 * 10 ** DECIMAL),
      3600 * 24,
      AuctionType.BOTH,
    );
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
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BOTH);

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
      .withArgs(this.sp2.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BOTH);

    const sp2Balance = BigInt(98 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);
  });

  it("SP1 bid for auction Again", async function () {
    // SP1 Bid
    const bidAmount = BigInt(2.5 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BOTH);

    const sp1Balance = BigInt(97.5 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });


  it("end bidding", async function () {
    await expect(this.auction.connect(this.admin).endBidding()).to.emit(
      this.auction,
      "BiddingEnded"
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.SELECTION);
  });

  it("select sp1 bid by client", async function () {
    const sp1BidAmount = BigInt(2.5 * 10 ** DECIMAL);
    await expect(this.auction.selectBid(this.sp1.address))
      .to.emit(this.auction, "BidSelected")
      .withArgs(this.sp1.address, sp1BidAmount);
  });

  it("Select to Dealmaking", async function () {
    // SP1 Bid
    const balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.auction.auctionState())
      .to.equal(AuctionState.DEAL_MAKING)

    const sp1Balance = BigInt(2.5 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(sp1Balance);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(balance);
  });
  // it("end selection", async function () {
  //   await expect(this.auction.connect(this.admin).endSelection()).to.emit(
  //     this.auction,
  //     "SelectionEnded"
  //   );

  //   // refunded
  //   const sp2Balance = BigInt(100 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);

  //   // no refund
  //   const sp1Balance = BigInt(97.5 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);

  //   const auctionBalance = BigInt(2.5 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
  //     auctionBalance
  //   );
  //   expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
  // });

  it("set SP1 bid deal success first 1 FIL", async function () {
    const payoutAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, payoutAmount)
    )
      .to.emit(this.auction, "BidDealSuccessfulPaid")
      .withArgs(this.sp1.address, payoutAmount, false);

    const auctionBalance = BigInt(1.5 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
      auctionBalance
    );

    const clientBalance = BigInt(1 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.client.address)).to.equal(
      clientBalance
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.DEAL_MAKING);
  });

  it("set SP1 bid deal success rest 1.5 FIL", async function () {
    const payoutAmount2th = BigInt(1.5 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, payoutAmount2th)
    )
      .to.emit(this.auction, "BidDealSuccessfulPaid")
      .withArgs(this.sp1.address, payoutAmount2th, true);

      expect(await this.auction.auctionState()).to.equal(AuctionState.COMPLETED);

  });
});
