
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
      size: 100 * 1024,
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
    const bidAmount = BigInt(1 * 10 ** DECIMAL);
    expect(await this.offer.owner()).to.equal(this.admin.address);
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
      .createOffer(BigInt(1000 * 10 ** DECIMAL), 500 * 1024, 100 * 1024, 1);
    const of1 = (await this.offer.bidOffers(0)).map((v: any) => v.valueOf())
    expect(of1[1]).to.equal(this.sp2.address);
  });

  it("Client accept offer", async function () {
    const bidAmount = BigInt(2000 * 10 ** DECIMAL);
    // await this.mockFil.connect(this.sp2).transfer(this.client.address, bidAmount)
    await expect( this.auction.connect(this.sp1).offerBid(this.sp2.address, 100)).to.be.revertedWith('invalid caller')
    await this.offer.connect(this.client).bidOffer(this.auction.address, 0)
    const offerBalance = BigInt(200 * 10 ** DECIMAL);
    const sp2Balance = BigInt((2000 - 200) * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp2.address)).to.equal(sp2Balance);
    expect(await this.mockFil.balanceOf(this.auction.address)).to.equal(offerBalance);
    expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
    const bids = await this.auction.getBids()
    expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
  });

});
