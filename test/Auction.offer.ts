
/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import BN from 'bignumber.js'
import { AuctionType, BidType, AuctionState, BidState } from './_utils'
import { createAuction } from "./helper";
const DECIMAL = 18;


describe("Test Auction", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction, offer} = await createAuction({
      funds: 2000,
      price: 200,
      size: 100,
    });
    this.admin = _admin;
    this.client = _client;
    this.sp1 = _sp1;
    this.sp2 = _sp2;
    this.sp3 = _sp3;
    this.mockFil = mockFil
    this.auction = auction;
    this.offer = offer;

  });

  it("Offer check", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // const bidTime = parseInt(new Date().getTime().toFixed(10));
    // SP1 Bid
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    expect(await this.offer.admin()).to.equal(this.admin.address);
    expect(await this.offer.token()).to.equal(this.mockFil.address);

    // expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });

  it("Make an offer", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp2)
      .approve(this.offer.address, BigInt(9999999 * 10 ** DECIMAL));

    await this.offer
      .connect(this.sp2)
      .makeOffer(BigInt(1000 * 10 ** DECIMAL), 500, 100, 1);
    const of1 = (await this.offer.bidOffers(0)).map((v: any) => v.valueOf())
    expect(of1[0]).to.equal(this.sp2.address);
    // // SP2 Bid
    // const bidAmount = BigInt(2 * 10 ** DECIMAL);
    // await expect(this.auction.connect(this.sp2).placeBid(bidAmount, BidType.BID))
    //   .to.emit(this.auction, "BidPlaced")
    //   .withArgs(this.sp2.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BID);

    // const sp2Balance = BigInt(98 * 10 ** DECIMAL);
    // expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);
  });

  it("Client accept offer", async function () {
    const bidAmount = BigInt(2 * 10 ** DECIMAL);
    await expect( this.auction.connect(this.sp1).offerBid(this.sp2.address)).to.be.revertedWith('invalid caller')
    await this.offer.connect(this.client).bidOffer(this.auction.address, 0)
    const offerBalance = BigInt(200 * 10 ** DECIMAL);
    const sp2Balance = BigInt((2000 - 200) * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(offerBalance);
    expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
    const bids = await this.auction.getBids()
    console.log('get bids')
    expect(await this.offer.auctionState()).to.equal(AuctionState.VERIFICATION);
  });

  it("SP cancel offer", async function () {
    await this.offer.connect(this.client).cancelOffer(this.auction.address, 0)
    const offerBalance = BigInt(200 * 10 ** DECIMAL);
    const sp2Balance = BigInt((2000 - 200) * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(offerBalance);
    expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
    const bids = await this.auction.getBids()
    console.log('get bids')
    expect(await this.offer.auctionState()).to.equal(AuctionState.VERIFICATION);
  });
  
  // it("end selection not correct time", async function () {
  //   await expect(this.auction.connect(this.admin).endSelection()).to.be.revertedWith(
  //     "Auction not SELECTION"
  //   );
  // });
  
  // it("end bidding", async function () {
  //   await expect(this.auction.connect(this.admin).endBidding()).to.emit(
  //     this.auction,
  //     "BiddingEnded"
  //   );
  //   expect(await this.auction.auctionState()).to.equal(AuctionState.SELECTION);
  // });


  // it("select sp1 bid by client", async function () {
  //   const sp1BidAmount = BigInt(3 * 10 ** DECIMAL);
  //   await expect(this.auction.selectBid(this.sp1.address))
  //     .to.emit(this.auction, "BidSelected")
  //     .withArgs(this.sp1.address, sp1BidAmount);
  // });

  // it("get auction status", async function () {
  //   expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION)
  // });

  // // it("select more than copies", async function () {
  // //   const sp1BidAmount = BigInt(3 * 10 ** DECIMAL);
  // //   await expect(this.auction.selectBid(this.sp2.address))
  // //     .to.be.revertedWith('All copies selected');
  // // });

  // // it("end selection", async function () {
  // //   await expect(this.auction.connect(this.admin).endSelection()).to.emit(
  // //     this.auction,
  // //     "SelectionEnded"
  // //   );

  // //   // refunded
  // //   const sp2Balance = BigInt(100 * 10 ** DECIMAL);
  // //   expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);

  // //   // no refund
  // //   const sp1Balance = BigInt(97 * 10 ** DECIMAL);
  // //   expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);

  // //   const auctionBalance = BigInt(3 * 10 ** DECIMAL);
  // //   expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
  // //     auctionBalance
  // //   );
  // // });

  // it("cancel auction when dealing", async function () {
  //   await expect(
  //     this.auction.cancelAuction()
  //   ).to.be.revertedWith("Auction not BIDDING/SELECTION");
  // });

  // it("set SP1 bid deal success and payout", async function () {
  //   const payoutAmount = BigInt(3 * 10 ** DECIMAL);
  //   await expect(
  //     this.auction.connect(this.sp1).setBidDealSuccess(this.sp1.address, payoutAmount)
  //   )
  //     .to.emit(this.auction, "BidDealSuccessfulPaid")
  //     .withArgs(this.sp1.address, payoutAmount, true);

  //   const auctionBalance = BigInt(0 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
  //     auctionBalance
  //   );

  //   const clientBalance = BigInt(3 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.client.address)).to.equal(
  //     clientBalance
  //   );
  // });
});
