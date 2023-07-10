/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import BN from 'bignumber.js'
import { BigNumber } from "ethers";
import { AuctionType, BidType, AuctionState, BidState } from './_utils'
const DECIMAL = 18;
import { createAuction } from "./helper";

describe("Test Auction BigNumber", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      funds: 5000,
      price: 3117
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
    const bidAmount =  web3.utils.toWei('3117', 'ether');
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BUY_NOW, {
      value: bidAmount
    }))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.SELECTED, BidType.BUY_NOW);

    // const sp1Balance =  web3.utils.toWei('6883', 'ether');
    expect(await ethers.provider.getBalance(this.auction.address)).to.equal(bidAmount);
  });
});
