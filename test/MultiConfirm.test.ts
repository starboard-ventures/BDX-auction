/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionType, BidType, AuctionState, BidState } from './_utils'
import { createAuction } from "./helper";
const DECIMAL = 18;

/**
 * 1. bid with fixed price 3 FIL
 * 2. confirm 1 FIL
 * 3. confirm the rest of 2 FIL
 * 4. auction completed
 */

describe("Test Auction Multi confirm", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      price: 3
    });
    this.admin = _admin;
    this.client = _client;
    this.sp1 = _sp1;
    this.sp2 = _sp2;
    this.sp3 = _sp3;
    this.mockFil = mockFil
    this.auction = auction;
  });

  it("SP1 buy wrong price for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // SP1 Bid
    const bidAmount = BigInt(4 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BUY_NOW, {
      value: bidAmount
    }))
      .to.be.revertedWith('Total price not right')
  });

  it("SP1 buy for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // SP1 Bid
    const bidAmount = BigInt(3 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BUY_NOW, {
      value: bidAmount
    }))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.SELECTED, BidType.BUY_NOW);


    expect(await ethers.provider.getBalance(this.auction.address)).to.equal(bidAmount);
  });

  it("set SP1 bid deal success first 1 FIL", async function () {
    const payoutAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, payoutAmount)
    )
      .to.emit(this.auction, "BidDealSuccessfulPaid")
      .withArgs(this.sp1.address, payoutAmount, false);

    const auctionBalance = BigInt(2 * 10 ** DECIMAL);
    expect(await ethers.provider.getBalance(this.auction.address)).to.equal(
      auctionBalance
    );

    // const clientBalance = BigInt(10001 * 10 ** DECIMAL);
    // expect(await ethers.provider.getBalance(this.client.address)).to.lessThan(
    //   clientBalance
    // );
    expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
  });

  it("set SP1 bid incorrect value", async function () {
    const payoutAmount = BigInt(4 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, payoutAmount)
    ).to.be.revertedWith("Not enough value");
    // await expect(
    //   this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, 0)
    // ).to.be.revertedWith("Confirm <= 0");

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
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      price: 3
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
    // SP1 Bid
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING, BidType.BID);

    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(0);
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
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(0);
  });

  it("SP1 bid for auction Again", async function () {
    // SP1 Bid
    const bidAmount = BigInt(2.5 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING, BidType.BID);

    const sp1Balance = BigInt(97.5 * 10 ** DECIMAL);
    expect({...await this.auction.bids(this.sp1.address)}.bidAmount).to.equal(bidAmount);
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
      .to.equal(AuctionState.VERIFICATION)

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
    expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
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
