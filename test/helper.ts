import { ethers, upgrades } from "hardhat";
import { AuctionType, BidType, AuctionState, BidState } from './_utils'
import web3 from 'web3'
const DECIMAL = 18;

export const createAuction = async (params?: any) => {
  params = params || {};
  const input = {
    funds: 100,
    // minPrice: 1,
    price: 5,
    // fixedPrice: 5,
    size: 100 * 1024,
    // type: AuctionType.BOTH,
    endTime: ((Date.now() + 10 * 60 * 1000) / 1000) >>> 0,
    ...params
  }

  const [_admin, _client, _sp1, _sp2, _sp3] = await ethers.getSigners();
  
  const MockFil = await ethers.getContractFactory("MockFil");
  const Impl = await ethers.getContractFactory("BigDataAuctionImpl");
  const EventBus = await ethers.getContractFactory("BigDataExchangeEvents");
  const OfferContract = await ethers.getContractFactory("BigDataExchangeOfferUpgradeable");
  
  const mockFil = await MockFil.deploy(BigInt(100000 * 10 ** DECIMAL));
  await mockFil.deployed();
  // const offer = await OfferContract.deploy(mockFil.address);
  const offerProxy = await upgrades.deployProxy(
    OfferContract,
 
    //Since the logic contract has an initialize() function
    // we need to pass in the arguments to the initialize()
    // function here.
    [mockFil.address],
 
    // We don't need to expressly specify this
    // as the Hardhat runtime will default to the name 'initialize'
    { initializer: "initialize" }
  );
  await offerProxy.deployed();
  // const offer = await OfferContract.deploy();
  const eventBus = await EventBus.deploy();
  const impl = await Impl.deploy();
  // await offer.deployed();
  await eventBus.deployed();
  await impl.deployed();

  // Seed sps with funds
  const seedAmount = BigInt((input.funds) * 10 ** DECIMAL);
  await mockFil
    .connect(_admin)
    .transfer(_sp1.address, seedAmount);
  await mockFil
    .connect(_admin)
    .transfer(_sp2.address, seedAmount);
  await mockFil
    .connect(_admin)
    .transfer(_sp3.address, seedAmount);

  const Auction = await ethers.getContractFactory("BigDataAuctionImpl");
  const AuctionFactory = await ethers.getContractFactory("BigDataExchange");
  const auctionFactory = await AuctionFactory.deploy(_admin.address, eventBus.address, offerProxy.address, mockFil.address, impl.address);
  await auctionFactory.deployed();

  await offerProxy.connect(_admin).setFactory([auctionFactory.address])

  const deployedAuction = await auctionFactory.createAuction(
    // BigInt((input.price) * 10 ** DECIMAL),
    web3.utils.toWei(input.price + '', 'ether'),
    input.size,
    // web3.utils.toWei('1', 'ether'),
    _client.address,
    // _admin.address,
    // web3.utils.toWei('5', 'ether'),
    // BigInt((input.fixedPrice) * 10 ** DECIMAL),
    // web3.utils.toWei(`${input.fixedPrice}`, 'ether'),
    input.endTime,
    '',
    1
  );
  // this.Auction = await ethers.getContractFactory("Auction");
  // _paymentToken,
  // _minPrice,
  // _client,
  // _admin,
  // _fixedPrice,
  // _biddingTime,
  // _type


  const receipt: any = await deployedAuction.wait();
  const auctionAddress = receipt?.events?.filter?.((x: { event: string }) => {
    return x.event === "AuctionCreated";
  })[0].args[0];
  
  const auction = await Auction.attach(auctionAddress);

  return {
    auction,
    mockFil,
    eventBus,
    offer: offerProxy,
    _admin,
    _client,
    _sp1,
    _sp2,
    _sp3
  }
}