/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import { AuctionState, BidState, AuctionType, BidType } from './_utils'
const DECIMAL = 18;

describe("Basic Auction", function () {
  before(async function () {
    const [_admin, _client, _sp1, _sp2, _sp3, _sp4] = await ethers.getSigners();
    this.admin = _admin;
    this.client = _client;
    this.sp1 = _sp1;
    this.sp2 = _sp2;
    this.sp3 = _sp3;
    this.sp4 = _sp4;
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
    await this.mockFil
      .connect(this.admin)
      .transfer(this.sp4.address, seedAmount);
 
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
      3600 * 24,
      AuctionType.BID,
      1,
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
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BID);

    const sp1Balance = BigInt(99 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });

  it("SP1 bid for getBidAmount", async function () {
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    expect(await this.auction.connect(this.sp1).getBidAmount(this.sp1.address)).to.equal(bidAmount);
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

  it("SP3 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp3)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    // SP3 Bid
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp3).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp3.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BID);

    const sp3Balance = BigInt(99 * 10 ** DECIMAL);

    expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);
  });

  it("SP4 bid for auction", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp4)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    // SP3 Bid
    const bidAmount = BigInt(2 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp4).placeBid(bidAmount, BidType.BID))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp4.address, bidAmount, BidState.BIDDING, BidType.BID, AuctionType.BID);

    const sp4Balance = BigInt(98 * 10 ** DECIMAL);

    expect(await this.mockFil.balanceOf(this.sp4.address)).to.equal(sp4Balance);
  });

  it("SP3 increased bid", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp3)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    // SP3 Bid
    const bidAmount = BigInt(2 * 10 ** DECIMAL);
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

  it("select sp1 and sp3 bid by client", async function () {
    const sp1BidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.client).selectBid(this.sp1.address))
      .to.emit(this.auction, "BidSelected")
      .withArgs(this.sp1.address, sp1BidAmount);

    // const sp2BidAmount = BigInt(3 * 10 ** DECIMAL);
    // await expect(this.auction.connect(this.client).selectBid(this.sp3.address))
    //   .to.emit(this.auction, "BidSelected")
    //   .withArgs(this.sp3.address, sp2BidAmount);
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
  //   const sp1Balance = BigInt(99 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);

  //   // no refund
  //   const sp3Balance = BigInt(97 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);

  //   const auctionBalance = BigInt(4 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
  //     auctionBalance
  //   );
  // });

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

  // it("set SP3 bid failure and refund", async function () {
  //   const refundAmount = BigInt(1 * 10 ** DECIMAL);
  //   const payoutAmount = BigInt(2 * 10 ** DECIMAL);
  //   await expect(
  //     this.auction
  //       .connect(this.admin)
  //       .setBidDealRefund(this.sp3.address, refundAmount)
  //   )
  //     .to.emit(this.auction, "BidDealUnsuccessfulRefund")
  //     .withArgs(this.sp3.address, refundAmount, payoutAmount);

  //   const auctionBalance = BigInt(0 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(
  //     auctionBalance
  //   );

  //   const sp3Balance = BigInt(98 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.sp3.address)).to.equal(sp3Balance);

  //   const clientBalance = BigInt(3 * 10 ** DECIMAL);
  //   expect(await this.mockFil.balanceOf(this.client.address)).to.equal(
  //     clientBalance
  //   );
  // });
});
