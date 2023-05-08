/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import { AuctionState, BidState, AuctionType, BidType } from './_utils'
import { createAuction } from "./helper";
const DECIMAL = 18;
function delay() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}
describe("No Bid Auction", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction();
    this.admin = _admin;
    this.client = _client;
    this.sp1 = _sp1;
    this.sp2 = _sp2;
    this.sp3 = _sp3;
    this.mockFil = mockFil
    this.auction = auction;
  });
  
  it("No bid Cancel", async function () {
    await delay();
    await expect(this.auction.connect(this.admin).endBidding()).to.emit(
      this.auction,
      "AuctionCancelledNoBids"
    );
    expect(await this.auction.auctionState()).to.equal(AuctionState.NO_BID_CANCELLED);
  });
});