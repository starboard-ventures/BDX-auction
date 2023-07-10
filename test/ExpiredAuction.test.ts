/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import { AuctionState, BidState, AuctionType, BidType } from './_utils'
import { createAuction } from "./helper";
const DECIMAL = 18;

// delay function
function delay(t: number) {
  return new Promise(resolve => setTimeout(resolve, t));
}

describe("Expired Auction", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      type: AuctionType.BID,
      // endTime: ((Date.now() + 20000) / 1000) >>> 0
    });
    this.admin = _admin;
    this.client = _client;
    this.sp1 = _sp1;
    this.sp2 = _sp2;
    this.sp3 = _sp3;
    this.mockFil = mockFil
    this.auction = auction;
  });


  it("bid expired auction", async function () {
    // await this.mockFil
    //   .connect(this.sp1)
    //   .approve(this.auction.address, BigInt(9999999 * 10 ** DECIMAL));
    // // SP1 Bid
    // await delay(10000)
    // const bidAmount = BigInt(1 * 10 ** DECIMAL);
    // await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BID)).to.be.revertedWith("Auction expired");
  });
});
