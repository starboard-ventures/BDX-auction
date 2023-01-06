//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Auction.sol";
import "./IBDE_NFT.sol";

contract AuctionFactory {
    address[] public auctionAddresses;
    address public admin;
    address internal _implementer;
    mapping(address => uint256) public nftTokenIds;

 
    event AuctionCreated(
        address indexed _auctionAddress,
        address indexed _client,
        address _admin,
        uint256 _minPrice,
        uint256 _fixedPrice,
        uint256 _endTime, // unit s;
        AuctionType _type
    );

    constructor(address _admin, address implementer_) {
        admin = _admin;
        _implementer = implementer_;
    }
    // ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","2","1","2","0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","112222","120","Client's CAR files are hosted in servers in US","CAR files are hosted in servers in US, EU, SG with 2x40Gbps bandwidth.","https://starboard-file.s3.us-east-2.amazonaws.com/iStock-1319459812-d8a39a3c.jpg"]

    function createAuction(
        string memory _tokenURI,
       
        MainParams calldata p
    ) external returns (address, uint256) {
        // params: 
        // IERC20 _paymentToken;
        // AuctionType _type;
        // uint256 _minPrice;
        // uint256 _fixedPrice;
        // address _client;
        // address _admin;
        // uint256 _endTime;
        // uint256 _size;
        // string  _title;
        // string  _desc;
        // string  _coverImage;
        // string _dataURI;
        
        Auction auction = new Auction(p);

        auctionAddresses.push(address(auction));
        emit AuctionCreated(address(auction), p._client, p._admin, p._minPrice, p._fixedPrice, p._endTime, p._type);
        uint256 tokenId = IBDE_NFT(_implementer).createBDENFT(_tokenURI, p._client, address(auction));
        nftTokenIds[address(auction)] = tokenId;
        return (address(auction), tokenId);
    }

    function getAuctions() external view returns (address[] memory) {
        return auctionAddresses;
    }

    function updateImplementer(address imp_) external {
        require(msg.sender == admin, "not admin");
        _implementer = imp_;
    }
}
