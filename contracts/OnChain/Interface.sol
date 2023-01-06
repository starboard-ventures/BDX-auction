//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

enum AuctionType {
    BID,
    FIXED,
    BOTH
}

enum BidType {
    BID,
    BUY_NOW
}

struct MainParams {
    IERC20 _paymentToken;
    AuctionType _type;
    uint256 _minPrice;
    uint256 _fixedPrice;
    address _client;
    address _admin;
    uint256 _endTime;
    uint256 _size;
    string  _title;
    string  _desc;
    string  _coverImage;
    string _dataURI;
}