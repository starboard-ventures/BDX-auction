/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionType, BidType, AuctionState, BidState } from './_utils'
import web3 from 'web3'
import { createAuction } from "./helper";
const DECIMAL = 18;

describe("Test Fixed Auction", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      price: 8000,
      funds: 100,
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
    await this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID)
    const sp1Balance = BigInt(100 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });
  it("SP2 buy with wrong price", async function () {
    // SP2 Buy
    expect(await await ethers.provider.getBalance(this.sp2.address)).to.equal(web3.utils.toWei('10000', 'ether'));
    const bidAmount = BigInt(2 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp2).placeBid(bidAmount, BidType.BUY_NOW, {
      value: bidAmount
    })).to.be.revertedWith('Total price not right')
  });

  it("SP2 buy auction", async function () {
    // SP2 Buy

    const bidAmount = web3.utils.toWei('8000', 'ether');
    await this.auction.connect(this.sp2).placeBid(bidAmount, BidType.BUY_NOW, {
      value: bidAmount
    })
    // SP2 selected
    // const sp2Balance = BigInt(8000 * 10 ** DECIMAL);
    expect(await await ethers.provider.getBalance(this.auction.address)).to.equal(web3.utils.toWei('8000', 'ether'));
    expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
  });
});
