//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Auction.sol";

/**
 *
 *       ,---,.     ,---,    ,--,     ,--,
 *     ,'  .'  \  .'  .' `\  |'. \   / .`|
 *   ,---.' .' |,---.'     \ ; \ `\ /' / ;
 *   |   |  |: ||   |  .`\  |`. \  /  / .'
 *   :   :  :  /:   : |  '  | \  \/  / ./
 *   :   |    ; |   ' '  ;  :  \  \.'  /
 *   |   :     \'   | ;  .  |   \  ;  ;
 *   |   |   . ||   | :  |  '  / \  \  \
 *   '   :  '; |'   : | /  ;  ;  /\  \  \
 *   |   |  | ; |   | '` ,/ ./__;  \  ;  \
 *   |   :   /  ;   :  .'   |   : / \  \  ;
 *   |   | ,'   |   ,.'     ;   |/   \  ' |
 *   `----'     '---'       `---'     `--`
 *  BDX Smart Contract
 */

contract BigDataExchange {
    address[] public auctionAddresses;
    address public admin;
    address public eventBus;
    address public offerAddr;
    address public paymentToken;

    event AuctionCreated(
        address indexed _auctionAddress,
        address indexed _client,
        address _admin,
        uint256 _price,
        uint256 _endTime, // unit s;
        uint256 indexed _id
    );

    constructor(address _admin, address _eventBus, address _offerAddr, address _paymentToken) {
        require(_admin != address(0), "Admin is 0.");
        require(_eventBus != address(0), "EventBus is 0.");
        require(_offerAddr != address(0), "Offer address is 0.");
        require(_paymentToken != address(0), "Token address is 0.");
        admin = _admin;
        eventBus = _eventBus;
        offerAddr = _offerAddr;
        paymentToken = _paymentToken;
    }

    // for users and admin create auctions.
    function createAuction(
        uint256 _price,
        uint256 _size,
        address _client,
        uint256 _endTime,
        string memory _metaUri,
        uint256 _id
    ) public returns (address) {
        require(_client != address(0), "Client is 0");
        require(_price >= 0, "_price invalid");
        require(_endTime > block.timestamp, "Endtime invalid.");
        BigDataAuction auction = new BigDataAuction(
            IERC20(paymentToken),
            _price,
            _size,
            _client,
            admin,
            _endTime,
            offerAddr,
            eventBus,
            _metaUri
        );

        auctionAddresses.push(address(auction));
        emit AuctionCreated(
            address(auction),
            _client,
            admin,
            _price,
            _endTime,
            _id
        );
        return address(auction);
    }

    // for get all auctions.
    function getAuctions() external view returns (address[] memory) {
        return auctionAddresses;
    }

    function setEventBus(address _eventBus) external {
        require(msg.sender == admin, "Not admin.");
        require(_eventBus != address(0), "Invalid");
        eventBus = _eventBus;
    }
    
    function setOfferAddr(address _offer) external {
        require(msg.sender == admin, "Not admin.");
        require(_offer != address(0), "Invalid");
        offerAddr = _offer;
    }

    function hasAuction(address _addr) public view returns (bool) {
        for (uint256 i = 0; i < auctionAddresses.length; i++) {
            if (auctionAddresses[i] == _addr) return true;
        }
        return false;
    }
}
