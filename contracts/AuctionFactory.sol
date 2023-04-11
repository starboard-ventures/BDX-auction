//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "./Auction.sol";

contract BigDataExchange {
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
        require(_admin != address(0), "Admin is 0.");
        admin = _admin;
    }
    // for users and admin create auctions.
    function createAuction(
        IERC20 _paymentToken,
        uint256 _minPrice,
        address _client,
        address _admin,
        uint256 _fixedPrice,
        uint256 _biddingTime, // unit s;
        AuctionType _type,
        uint256 _id
    ) external returns (address) {
        require(_minPrice >= 0, "MinPrice invalid");
        require(_client != address(0), "Client is 0");
        require(_admin != address(0), "Admin is 0");
        require(_fixedPrice >= 0, "fixedPrice invalid");
        require(
            _biddingTime > 0,
            "bid time invalid."
        );
        BigDataAuction auction = new BigDataAuction(
            _paymentToken,
            _minPrice,
            _client,
            _admin,
            _fixedPrice,
            _biddingTime,
            _type
        );

        auctionAddresses.push(address(auction));
        emit AuctionCreated(
            address(auction),
            _client,
            _admin,
            _minPrice,
            _fixedPrice,
            _biddingTime,
            _type,
            _id
        );
        return address(auction);
    }

    // for get all auctions.
    function getAuctions() external view returns (address[] memory) {
        return auctionAddresses;
    }
}
