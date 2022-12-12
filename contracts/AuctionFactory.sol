//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Auction.sol";

contract AuctionFactory {
    address[] public auctionAddresses;
    address public admin;

    event AuctionCreated(
        address indexed _auctionAddress,
        address indexed _client,
        address _admin,
        uint256 _minPrice,
        uint256 _fixedPrice,
        uint256 _biddingTime, // unit s;
        AuctionType _type,
        uint256 indexed _id
    );

    constructor(address _admin) {
        admin = _admin;
    }

    function createAuction(
        IERC20 _paymentToken,
        uint256 _minPrice,
        int32 _noOfCopies,
        address _client,
        address _admin,
        uint256 _fixedPrice,
        uint256 _biddingTime, // unit s;
        AuctionType _type,
        uint256 _id
    ) external returns (address) {
        Auction auction = new Auction(
            _paymentToken,
            _minPrice,
            _noOfCopies,
            _client,
            _admin,
            _fixedPrice,
            _biddingTime,
            _type
        );

        auctionAddresses.push(address(auction));
        emit AuctionCreated(address(auction), _client, _admin, _minPrice, _fixedPrice, _biddingTime, _type, _id);
        return address(auction);
    }

    function getAuctions() external view returns (address[] memory) {
        return auctionAddresses;
    }
}
