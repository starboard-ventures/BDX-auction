//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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
 *  BDX General Bids
 */

interface IFactory {
    function hasAuction(address _addr) external returns (bool);
}

interface IAuction {
    function size() external view returns (uint256);

    function price() external view returns (uint256);

    function client() external view returns (address);

    function offerBid(address _addr) external returns (bool);
}

enum OfferStatus {
    Active,
    Cancelled
}
enum OfferType {
    Single,
    Multiple
}

struct Deal {
    uint256 value;
    uint256 size;
    uint256 createTime;
    address bider;
}

struct BidOffer {
    uint256 id;
    address owner;
    uint256 totalValue;
    uint256 totalSize;
    uint256 minSize;
    uint256 validValue;
    uint256 validSize;
    uint256 createTime;
    OfferStatus status;
    OfferType offerType;
    address[] deals; // success deal auctions.
}

contract BigDataExchangeOffer is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _offerId;
    IERC20 public token;

    address[] public factorys;
    address[] public dealsList;
    mapping(uint256 => BidOffer) public bidOffers;
    mapping(address => Deal) public deals;
    mapping(address => bool) public _isBlacklisted;

    event OfferCreated(
        uint256 indexed id,
        address indexed owner
    );

    event OfferCancelled(uint256 indexed id, address indexed sender);
    event OfferAccepted(uint256 indexed id, address indexed owner, address indexed auction);

    constructor(address _token) {
        require(_token != address(0), "invalid _token");
        token = IERC20(_token);
    }

    function setFactory(address[] memory _addrs) public onlyOwner {
        factorys = _addrs;
    }

    function createOffer(
        uint256 _value,
        uint256 _size,
        uint256 _minSize,
        OfferType _type
    ) public {
        require(_value > 0, "value not > 0");
        require(_size > 0, "size not > 0");
        require(token.balanceOf(msg.sender) >= _value, "balance not enough");
        require(!_isBlacklisted[msg.sender], "blacklisted address");
        require(token.allowance(msg.sender, address(this)) >= _value, "allowance not enough");
        BidOffer storage g = bidOffers[_offerId.current()];
        g.id = _offerId.current();
        _offerId.increment();
        g.owner = msg.sender;
        g.status = OfferStatus.Active;
        g.totalSize = _size;
        g.totalValue = _value;
        g.minSize = _minSize;
        g.validValue = _value;
        g.validSize = _size;
        g.offerType = _type;
        g.createTime = block.timestamp;
        emit OfferCreated(_offerId.current() - 1, msg.sender);
    }

    function cancelOffer(uint256 _id) external nonReentrant {
        BidOffer storage g = bidOffers[_id];
        require(
            msg.sender == g.owner || msg.sender == owner(),
            "not owner or admin"
        );
        require(g.status == OfferStatus.Active, "status not active");
        require(g.validValue > 0, "no available token");
        g.validValue = 0;
        g.validSize = 0;
        g.status = OfferStatus.Cancelled;
        emit OfferCancelled(_id, msg.sender);
    }

    function bidOffer(address _auction, uint256 _id) external nonReentrant {
        require(isValidAuction(_auction), "unvalid auction");
        BidOffer storage offer = bidOffers[_id];
        require(offer.status == OfferStatus.Active, "status not active");
        IAuction au = IAuction(_auction);
        require(au.client() == msg.sender, "invalid client");
        uint256 size = au.size();
        uint256 price = au.price();
        require(price <= offer.validValue, "price not enough");
        require(size <= offer.validSize, "size not enough");
        require(size >= offer.minSize, "size invalid");
        require(
            price / size <= offer.totalValue / offer.totalSize,
            "unit price invalid"
        );
        require(token.transferFrom(offer.owner, _auction, price), "pay failed");
        au.offerBid(offer.owner);
        Deal memory deal = Deal(price, size, block.timestamp, offer.owner);
        offer.deals.push(_auction);
        dealsList.push(_auction);
        deals[_auction] = deal;
        if (offer.offerType == OfferType.Single) {
            offer.validValue = 0;
            offer.validSize = 0;
            offer.status = OfferStatus.Cancelled;
        } else {
            offer.validValue -= price;
            offer.validSize -= size;
        }
        emit OfferAccepted(_id, offer.owner, _auction);
    }

    function setBlacklist(address _addr, bool _isBlacklist) external onlyOwner {
        _isBlacklisted[_addr] = _isBlacklist;
    }

    function isValidAuction(address _addr) internal returns (bool) {
        for (uint256 i = 0; i < factorys.length; i++) {
            address fc = factorys[i];
            if (IFactory(fc).hasAuction(_addr)) return true;
        }
        return false;
    }

    // getter functions
    function getOfferCount() public view returns (uint256) {
        return _offerId.current();
    }

    function getOffers() public view returns (BidOffer[] memory) {
        BidOffer[] memory offerArray = new BidOffer[](_offerId.current());
        for (uint256 i = 0; i < _offerId.current(); i++) {
            BidOffer storage offer = bidOffers[i];
            if(offer.createTime > 0) {
                offerArray[i] = offer;
            }
        }
        return offerArray;
    }

    function getOffers(address _owner) public view returns (BidOffer[] memory) {
        BidOffer[] memory offerArray = new BidOffer[](_offerId.current());
        for (uint256 i = 0; i < _offerId.current(); i++) {
            BidOffer storage offer = bidOffers[i];
            if (offer.owner == _owner) {
                offerArray[offerArray.length] = offer;
            }
        }
        return offerArray;
    }

    function getDeals() public view returns (Deal[] memory) {
        Deal[] memory dealArray = new Deal[](dealsList.length);
        for (uint256 i = 0; i < dealsList.length; i++) {
            Deal storage dl = deals[dealsList[i]];
            dealArray[i] = dl;
        }
        return dealArray;
    }

    function getDeals(address _owner) public view returns (Deal[] memory) {
        Deal[] memory dealArray = new Deal[](dealsList.length);
        for (uint256 i = 0; i < dealsList.length; i++) {
            if (dealsList[i] == _owner) {
                Deal storage dl = deals[dealsList[i]];
                dealArray[dealArray.length] = dl;
            }
        }
        return dealArray;
    }
}
