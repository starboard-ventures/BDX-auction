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

    constructor(address _admin, address _eventBus) {
        require(_admin != address(0), "Admin is 0.");
        require(_eventBus != address(0), "EventBus is 0.");
        admin = _admin;
        eventBus = _eventBus;
    }
    // for users and admin create auctions.
    function createAuction(
        IERC20 _paymentToken,
        uint256 _minPrice,
        address _client,
        address _admin,
        uint256 _fixedPrice,
        uint256 _endTime, // unit s;
        AuctionType _type,
        string memory _metaUri,
        uint256 _id
    ) external returns (address) {
        require(_minPrice >= 0, "MinPrice invalid");
        require(_client != address(0), "Client is 0");
        require(_admin != address(0), "Admin is 0");
        require(_fixedPrice >= 0, "fixedPrice invalid");
        require(
            _endTime > block.timestamp,
            "end time invalid."
        );
        BigDataAuction auction = new BigDataAuction(
            _paymentToken,
            _minPrice,
            _client,
            _admin,
            _fixedPrice,
            _endTime,
            _type,
            eventBus,
            _metaUri
        );

        auctionAddresses.push(address(auction));
        emit AuctionCreated(
            address(auction),
            _client,
            _admin,
            _minPrice,
            _fixedPrice,
            _endTime,
            _type,
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
}
