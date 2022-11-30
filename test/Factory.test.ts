/* eslint-disable node/no-unsupported-features/es-builtins */
import { expect } from "chai";
import { ethers } from "hardhat";
import web3 from 'web3'
import { AuctionState, BidState, AuctionType, BidType } from './_utils'
const DECIMAL = 18;

describe("Factory Auction", function () {
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
      this.auctionFactory = await this.AuctionFactory.deploy(this.sp1.address);
  
  });

  it("only admin can create auction", async function () {
    await expect(this.auctionFactory.createAuction(
      this.mockFil.address,
      BigInt(1 * 10 ** DECIMAL),
      1,
      this.client.address,
      this.admin.address,
      web3.utils.toWei('2', 'ether'),
      3600 * 24,
      AuctionType.BID,
    )).to.be.revertedWith("Only admin can create")
  });

  it("noOfCopies should be 1", async function () {
    await expect(this.auctionFactory.connect(this.sp1).createAuction(
      this.mockFil.address,
      BigInt(1 * 10 ** DECIMAL),
      2,
      this.client.address,
      this.admin.address,
      web3.utils.toWei('2', 'ether'),
      3600 * 24,
      AuctionType.FIXED,
    )).to.be.revertedWith('noOfCopies should be 1')
  });

  it("noOfCopies has to be > 0", async function () {
    await expect(this.auctionFactory.connect(this.sp1).createAuction(
      this.mockFil.address,
      BigInt(1 * 10 ** DECIMAL),
      -1,
      this.client.address,
      this.admin.address,
      web3.utils.toWei('2', 'ether'),
      3600 * 24,
      AuctionType.BID,
    )).to.be.revertedWith('noOfCopies has to be > 0')
  });
});
