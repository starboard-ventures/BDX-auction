/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionType, BidType, AuctionState, BidState } from './_utils'
const DECIMAL = 18;
import { createAuction } from "./helper";
/**
 * 1. bid with fixed price 3 FIL
 * 2. confirm 1 FIL
 * 3. confirm the rest of 2 FIL
 * 4. auction completed
 */

describe("Test Auto Select", function () {
  before(async function () {
    const {_admin, _client, _sp1, _sp2, _sp3, mockFil, auction} = await createAuction({
      type: AuctionType.BOTH,
      fixedPrice: 3,
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
    const bidAmount = BigInt(3 * 10 ** DECIMAL);
    await expect(this.auction.connect(this.sp1).placeBid(bidAmount, BidType.BUY_NOW))
      .to.emit(this.auction, "BidPlaced")
      .withArgs(this.sp1.address, bidAmount, BidState.SELECTED, BidType.BUY_NOW, AuctionType.BOTH);

    const sp1Balance = BigInt(97 * 10 ** DECIMAL);
    expect(await this.mockFil.balanceOf(this.sp1.address)).to.equal(sp1Balance);
  });

  it("end bidding", async function () {
    const payoutAmount = BigInt(1 * 10 ** DECIMAL);
    await expect(
      this.auction.connect(this.admin).endBidding()
    )
    await expect(
      this.auction.connect(this.admin).endSelection()
    )

    const state =  await this.auction.bids(this.sp1.address)
    expect(state.bidState).to.equal(BidState.SELECTED);
    expect(await this.auction.auctionState()).to.equal(AuctionState.VERIFICATION);
  });

});
