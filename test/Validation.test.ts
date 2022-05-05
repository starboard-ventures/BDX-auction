/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";

const DECIMAL = 18;
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

describe("Basic Auction", function () {
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

  it("create auction", async function () {
    const deployedAuction = await this.auctionFactory.createAuction(
      this.mockFil.address,
      BigInt(1 * 10 ** DECIMAL),
      1,
      this.client.address,
      this.admin.address
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
    expect(await this.auction.minPrice()).to.equal(BigInt(1 * 10 ** DECIMAL));
    expect(await this.auction.noOfCopies()).to.equal(1);
  });

  it("SP1 insufficient allowance", async function () {
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).placeBid(bidAmount)
    ).to.be.revertedWith("Insufficient allowance");
  });

  it("SP1 bid below min price", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp1)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    const bidAmount = BigInt(0.5 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).placeBid(bidAmount)
    ).to.be.revertedWith("Bid amount < minPrice");
  });

  it("SP1 bid insufficient mockfil", async function () {
    // Approve SPs wallet
    const bidAmount = BigInt(10000 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).placeBid(bidAmount)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("SP1 bid for auction", async function () {
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.BIDDING);

    const sp1Balance = BigInt(99 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });

  it("SP2 bid for auction 0 mockfil", async function () {
    // Approve SPs wallet
    await this.mockFil
      .connect(this.sp2)
      .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));

    const bidAmount = BigInt(0 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp2).placeBid(bidAmount))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp2.address, bidAmount, BidState.CANCELLED);

    const sp2Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);
  });

  it("select sp1 bid failed bidding ended", async function () {
    await expect(
      this.auction.connect(this.client).selectBid(this.sp1.address)
    ).to.be.revertedWith("Auction not SELECTION");
  });

  it("end bidding fail no admin", async function () {
    await expect(
      this.auction.connect(this.sp2).endBidding()
    ).to.be.revertedWith("Txn sender not admin");
  });

  it("select sp2 cancelled bid failed", async function () {
    await expect(
      this.auction.connect(this.client).selectBid(this.sp2.address)
    ).to.be.revertedWith("Auction not SELECTION");
  });

  it("end bidding", async function () {
    await expect(this.auction.connect(this.admin).endBidding()).to.emit(
      this.auction,
      "BiddingEnded"
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.SELECTION);
  });

  it("end bidding failed bidding ended", async function () {
    await expect(
      this.auction.connect(this.admin).endBidding()
    ).to.be.revertedWith("Auction not BIDDING");
  });

  it("SP1 bid failed bidding ended", async function () {
    const bidAmount = BigInt(10000 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.sp1).placeBid(bidAmount)
    ).to.be.revertedWith("Auction not BIDDING");
  });

  it("select sp2 cancelled bid failed", async function () {
    await expect(
      this.auction.connect(this.client).selectBid(this.sp2.address)
    ).to.be.revertedWith("Bid not PENDING_SELECTION");
  });

  it("sp1 end selection fail", async function () {
    await expect(
      this.auction.connect(this.sp1).endSelection()
    ).to.be.revertedWith("Txn sender not admin or client");
  });

  it("set SP1 bid deal success fail", async function () {
    await expect(
      this.auction.connect(this.admin).setBidDealSuccess(this.sp1.address)
    ).to.be.revertedWith("Auction not VERIFICATION");
  });

  it("end selection", async function () {
    await expect(this.auction.connect(this.admin).endSelection()).to.emit(
      this.auction,
      "SelectionEnded"
    );
  });

  it("set SP3 bid deal success fail", async function () {
    await expect(
      this.auction.connect(this.admin).setBidDealSuccess(this.sp2.address)
    ).to.be.revertedWith("Deal not selected");
  });

  it("set SP1 bid deal refund fail", async function () {
    const payoutAmount = BigInt(50 * 10 ** DECIMAL);
    await expect(
      this.auction
        .connect(this.admin)
        .setBidDealRefund(this.sp1.address, payoutAmount)
    ).to.be.revertedWith("Refund amount > bid amount");
  });

  it("set SP1 bid deal success and payout", async function () {
    const payoutAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.admin).setBidDealSuccess(this.sp1.address)
    )
      .to.emit(this.auction, "BidDealSuccessfulPaid")
      .withArgs(this.sp1.address, payoutAmount);

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
