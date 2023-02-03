//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

enum AuctionType {
    BID,
    FIXED,
    BOTH
}

enum BidType {
    BID,
    BUY_NOW,
    PARTIAL_BID,
    PARTIAL_BUY
}

contract Auction is ReentrancyGuard {
    //Constants for auction
    enum AuctionState {
        BIDDING,
        NO_BID_CANCELLED,
        SELECTION,
        DEAL_MAKING,
        CANCELLED,
        COMPLETED
    }

    enum BidState {
        BIDDING,
        PENDING_SELECTION,
        SELECTED,
        REFUNDED,
        CANCELLED,
        DEAL_SUCCESSFUL_PAID,
        DEAL_UNSUCCESSFUL_REFUNDED
    }

    struct Bid {
        uint256 bidAmount;
        uint256 bidTime;
        uint256 bidConfirmed; // already confirmed to client
        uint256 paid; // total payment of SP bid.
        BidState bidState;
    }

    struct AuctionItem {
        AuctionState auctionState;
        AuctionType auctionType;
        uint256 startTime;
        uint256 endTime;
        uint256 minPrice;
        uint256 fixedPrice;
        address[] bidders;
        address client;
        mapping(address => Bid) bids;
        mapping(AuctionState => uint256) times;
    }

    AuctionState public auctionState;
    AuctionType public auctionType;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public minPrice;
    uint256 public fixedPrice;
    int8 public version = 4;
    uint256 public split = 1; // pay as your deal split
    uint256 public depositPercent = 10; // 10% deposit
    uint256 internal depositAmount = 0;
    address[] public bidders;
    mapping(address => uint256) public deposits;
    mapping(address => Bid) public bids;
    mapping(AuctionState => uint256) public times;

    address public admin;
    address public client;
    IERC20 private paymentToken;

    event AuctionCreated(
        address indexed _client,
        uint256 _minPrice,
        uint256 _fixedPrice,
        AuctionState _auctionState,
        AuctionType _type
    );
    event BidPlaced(
        address indexed _bidder,
        uint256 _value,
        BidState _bidState,
        BidType _bidType,
        AuctionType _auctionType
    );
    event BiddingEnded();
    event BidSelected(address indexed _bidder, uint256 _value);
    event SelectionEnded();
    event AuctionCancelled();
    event AuctionCancelledNoBids();
    event BidsUnselectedRefunded(uint32 _count);
    event AllBidsRefunded(uint32 _count);
    event BidDealSuccessfulPaid(
        address indexed _bidder,
        uint256 _value,
        bool finished
    );
    event BidDealUnsuccessfulRefund(
        address indexed _bidder,
        uint256 _refundAmount,
        uint256 _paidAmount
    );
    event ContinuePaid(
        address indexed _bidder,
        uint256 _bidAmount,
        uint256 _last
    );
    event AuctionEnded();

    constructor(
        IERC20 _paymentToken,
        uint256 _minPrice,
        address _client,
        address _admin,
        uint256 _fixedPrice,
        uint256 _biddingTime, // unit s;
        AuctionType _type
    ) {
        admin = _admin;
        paymentToken = IERC20(_paymentToken);

        minPrice = _minPrice;
        fixedPrice = _fixedPrice;
        updateState(AuctionState.BIDDING);
        auctionType = _type;
        client = _client;
        startTime = block.timestamp;
        endTime = block.timestamp + _biddingTime;
        if (_type == AuctionType.FIXED) {
            depositAmount = uint256((_fixedPrice * depositPercent) / 100);
        } else {
            depositAmount = uint256((_minPrice * depositPercent) / 100);
        }
        emit AuctionCreated(
            client,
            minPrice,
            fixedPrice,
            auctionState,
            auctionType
        );
    }

    //SPs place bid
    function placeBid(uint256 _bid, BidType _bidType)
        public
        notExpired
        nonReentrant
    {
        require(auctionState == AuctionState.BIDDING, "Auction not BIDDING");
        require(_bid > 0, "Bid not > 0");
        require(getAllowance(msg.sender) > _bid, "Insufficient allowance");
        require(
            _bid <= paymentToken.balanceOf(msg.sender),
            "Insufficient balance"
        );
        if (deposits[msg.sender] > 0) {
            require(
                _bidType == BidType.PARTIAL_BID ||
                    _bidType == BidType.PARTIAL_BUY,
                "should be partial offer"
            );
        }
        Bid storage b = bids[msg.sender];
        if (b.bidAmount > 0) {
            require(_bid > b.bidAmount, "Bid not > previous bid");
        }
        if (!hasBidded(msg.sender)) {
            bidders.push(msg.sender);
        }
        if (auctionType == AuctionType.FIXED) {
            require(
                _bidType == BidType.BUY_NOW || _bidType == BidType.PARTIAL_BUY,
                "bidType not right"
            );
            buyFixedAuction(_bid, _bidType);
            return;
        } else if (
            auctionType == AuctionType.BOTH &&
            (_bidType == BidType.BUY_NOW || _bidType == BidType.PARTIAL_BUY)
        ) {
            buyWithFixedPrice(_bid, _bidType);
            return;
        }
        bidAuction(_bid, _bidType);
    }

    // bid BID and BOTH auctions
    // 1st and additional bid
    function bidAuction(uint256 _bid, BidType _bidType) internal {
        // Normal bid function
        Bid storage b = bids[msg.sender];
        uint256 _payment = _bid;
        bool hasDeposit = deposits[msg.sender] > 0;
        if (_bidType == BidType.PARTIAL_BID) {
            _payment = hasDeposit
                ? uint256(_bid / split)
                : uint256(_bid / split) + depositAmount;
        } else {
            _payment = _bid - b.paid;
        }
        paymentToken.transferFrom(msg.sender, address(this), _payment);
        if (!hasDeposit && _bidType == BidType.PARTIAL_BID) {
            deposits[msg.sender] = depositAmount;
        }
        if (_bidType == BidType.PARTIAL_BID) {
            b.paid = hasDeposit
                ? b.paid + _payment
                : b.paid + _payment - depositAmount;
        } else {
            b.paid = _bid;
        }
        b.bidAmount = _bid;
        b.bidTime = block.timestamp;
        b.bidState = BidState.BIDDING;

        emit BidPlaced(msg.sender, _bid, b.bidState, _bidType, auctionType);
    }

    function buyFixedAuction(uint256 _bid, BidType _bidType) internal {
        require(_bid == fixedPrice, "Price not right");
        uint256 _payment = _bid;
        if (_bidType == BidType.PARTIAL_BUY) {
            _payment = uint256(_bid / split) + depositAmount;
        }
        paymentToken.transferFrom(msg.sender, address(this), _payment);
        Bid storage b = bids[msg.sender];
        b.bidState = BidState.SELECTED;
        b.bidAmount = _bid;
        b.paid = _bid;
        b.bidTime = block.timestamp;
        if (_bidType == BidType.PARTIAL_BUY) {
            b.paid = uint256(_bid / split);
            deposits[msg.sender] = depositAmount;
        }
        updateState(AuctionState.DEAL_MAKING);
        emit BidPlaced(
            msg.sender,
            _bid,
            b.bidState,
            BidType.BUY_NOW,
            auctionType
        );
    }

    // first buy or bid -> buy
    function buyWithFixedPrice(uint256 _bid, BidType _bidType) internal {
        require(_bid == fixedPrice, "Total price not right");
        Bid storage b = bids[msg.sender];
        bool hasDeposit = deposits[msg.sender] > 0;
        if (b.paid > 0 && !hasDeposit) {
            require(_bidType == BidType.BUY_NOW, "bidType not right");
        }
        // pay amount this time
        uint256 _payment = _bid;
        if (_bidType == BidType.PARTIAL_BUY) {
            _payment = hasDeposit
                ? uint256(_bid / split)
                : uint256(_bid / split) + depositAmount;
            if (b.paid > 0) {
                require(_payment > b.paid, "paid amount not right");
                _payment = _payment - b.paid;
            }
        } else {
            _payment = _bid - b.paid;
        }
        paymentToken.transferFrom(msg.sender, address(this), _payment);
        if (!hasDeposit) {
            deposits[msg.sender] = depositAmount;
        }
        b.bidState = BidState.SELECTED;
        b.bidAmount = _bid;
        if(_bidType == BidType.PARTIAL_BID) {
            b.paid = hasDeposit
                ? b.paid + _payment
                : b.paid + _payment - depositAmount;
        } else {
            b.paid = _bid;
        }
        b.bidTime = block.timestamp;
        refundOthers(msg.sender);
        updateState(AuctionState.DEAL_MAKING);
        emit BidPlaced(msg.sender, _bid, b.bidState, _bidType, auctionType);
    }

    function endBidding() public onlyAdmin {
        require(auctionState == AuctionState.BIDDING, "Auction not BIDDING");
        for (uint8 i = 0; i < bidders.length; i++) {
            Bid storage b = bids[bidders[i]];
            if (b.bidState != BidState.CANCELLED) {
                updateState(AuctionState.SELECTION);
                updateAllOngoingBidsToPending();
                emit BiddingEnded();
                return;
            }
        }
        updateState(AuctionState.NO_BID_CANCELLED);
        emit AuctionCancelledNoBids();
    }

    //Client selectBid
    function selectBid(address selectedAddress)
        public
        onlyClientOrAdmin
        nonReentrant
    {
        require(
            auctionState == AuctionState.SELECTION,
            "Auction not SELECTION"
        );
        Bid storage b = bids[selectedAddress];
        require(
            b.bidState == BidState.PENDING_SELECTION,
            "Bid not PENDING_SELECTION"
        );
        b.bidState = BidState.SELECTED;
        // only 1 winner.
        refundUnsuccessfulBids();
        updateState(AuctionState.DEAL_MAKING);
        emit BidSelected(selectedAddress, b.bidAmount);
    }

    //auto ends the selection phase
    function endSelection() public onlyClientOrAdmin {
        require(
            auctionState == AuctionState.SELECTION,
            "Auction not SELECTION"
        );
        // auto select the highest one.
        uint256 highest = bids[bidders[0]].bidAmount;
        address winner = bidders[0];
        for (uint8 i = 1; i < bidders.length; i++) {
            Bid storage b = bids[bidders[i]];
            if (b.bidAmount > highest) {
                highest = b.bidAmount;
                winner = bidders[i];
            }
        }
        selectBid(winner);
        emit SelectionEnded();
    }

    function continuePay() public nonReentrant {
        require(
            auctionState == AuctionState.DEAL_MAKING,
            "Auction not DEAL_MAKING"
        );
        Bid storage b = bids[msg.sender];
        require(b.bidState == BidState.SELECTED, "Bid not SELECTED");
        require(b.paid < b.bidAmount, "already total paid");
        uint256 _last = b.bidAmount - b.paid;
        uint256 _payment = b.bidAmount / split;
        require(getAllowance(msg.sender) > _payment, "Insufficient allowance");
        require(
            _payment <= paymentToken.balanceOf(msg.sender),
            "Insufficient balance"
        );
        paymentToken.transferFrom(msg.sender, address(this), _payment);
        paymentToken.transfer(client, _payment);
        b.paid = b.paid + _payment;
        b.bidConfirmed = b.bidConfirmed + _payment;
        emit ContinuePaid(msg.sender, _payment, _last);
    }

    function cancelAuction() public onlyClientOrAdmin {
        require(
            auctionState == AuctionState.BIDDING ||
                auctionState == AuctionState.SELECTION,
            "Auction not BIDDING/SELECTION"
        );
        updateState(AuctionState.CANCELLED);
        refundAllBids();
        emit AuctionCancelled();
    }

    function setBidDealSuccess(address bidder, uint256 value)
        public
        nonReentrant
    {
        require(
            auctionState == AuctionState.DEAL_MAKING,
            "Auction not DEAL_MAKING"
        );
        require(
            msg.sender == admin || msg.sender == bidder,
            "Txn sender not admin or SP"
        );
        require(value > 0, "Confirm <= 0");
        Bid storage b = bids[bidder];
        require(b.bidState == BidState.SELECTED, "Deal not selected");
        require(b.paid == b.bidAmount, "Not fully paid");
        require(value <= b.bidAmount - b.bidConfirmed, "Not enough value");
        if(deposits[bidder] > 0) {
            require(value == b.bidAmount - b.bidConfirmed, "Deposit not fully paid");
        }
        paymentToken.transfer(client, value);
        b.bidConfirmed = b.bidConfirmed + value;
        if (b.bidConfirmed == b.bidAmount) {
            b.bidState = BidState.DEAL_SUCCESSFUL_PAID;
            updateAuctionEnd();
        }
        emit BidDealSuccessfulPaid(
            bidder,
            value,
            b.bidConfirmed == b.bidAmount
        );
    }

    //sets bid deal to fail and payout amount
    function setBidDealRefund(address bidder, uint256 refundAmount)
        public
        onlyAdmin
    {
        require(
            auctionState == AuctionState.DEAL_MAKING,
            "Auction not DEAL_MAKING"
        );
        Bid storage b = bids[bidder];
        require(b.bidState == BidState.SELECTED, "Deal not selected");
        require(
            refundAmount <= b.bidAmount - b.bidConfirmed,
            "Refund amount > the rest"
        );
        paymentToken.transfer(bidder, refundAmount);
        // transfer the rest to client
        paymentToken.transfer(
            client,
            b.bidAmount - b.bidConfirmed - refundAmount
        );
        b.bidState = BidState.DEAL_UNSUCCESSFUL_REFUNDED;
        updateAuctionEnd();
        emit BidDealUnsuccessfulRefund(
            bidder,
            refundAmount,
            b.bidAmount - refundAmount
        );
    }

    //Helper Functions
    function getAllowance(address sender) public view returns (uint256) {
        return paymentToken.allowance(sender, address(this));
    }

    function hasBidded(address bidder) private view returns (bool) {
        for (uint8 i = 0; i < bidders.length; i++) {
            if (bidders[i] == bidder) {
                return true;
            }
        }
        return false;
    }

    function refundAllBids() internal {
        uint8 count = 0;
        for (uint8 i = 0; i < bidders.length; i++) {
            Bid storage b = bids[bidders[i]];
            if (b.paid > 0 || deposits[bidders[i]] > 0) {
                uint256 refundAmount = b.paid - b.bidConfirmed + deposits[bidders[i]];
                paymentToken.transfer(bidders[i], refundAmount);
                deposits[bidders[i]] = 0;
                b.paid = 0;
                b.bidState = BidState.REFUNDED;
                count++;
            }
        }

        emit AllBidsRefunded(count);
    }

    function refundOthers(address _buyer) internal {
        uint8 count = 0;
        for (uint8 i = 0; i < bidders.length; i++) {
            if (bidders[i] == _buyer) continue;
            Bid storage b = bids[bidders[i]];
            if (b.paid > 0) {
                uint256 refundAmount = b.paid + deposits[bidders[i]];
                paymentToken.transfer(bidders[i], refundAmount);
                deposits[bidders[i]] = 0;
                b.paid = 0;
                b.bidState = BidState.REFUNDED;
                count++;
            }
        }
        emit BidsUnselectedRefunded(count);
    }

    function updateAllOngoingBidsToPending() internal {
        for (uint8 i = 0; i < bidders.length; i++) {
            Bid storage b = bids[bidders[i]];
            if (b.bidAmount > 0) {
                b.bidState = BidState.PENDING_SELECTION;
            }
        }
    }

    function updateAuctionEnd() internal {
        for (uint8 i = 0; i < bidders.length; i++) {
            Bid storage b = bids[bidders[i]];
            if (
                b.bidState == BidState.PENDING_SELECTION ||
                b.bidState == BidState.SELECTED ||
                b.bidState == BidState.BIDDING
            ) {
                return;
            }
        }
        updateState(AuctionState.COMPLETED);
        emit AuctionEnded();
    }

    // only refunds bids that are currently PENDING_SELECTION.
    function refundUnsuccessfulBids() internal {
        uint8 count = 0;
        for (uint8 i = 0; i < bidders.length; i++) {
            Bid storage b = bids[bidders[i]];
            if (b.bidState == BidState.PENDING_SELECTION) {
                if (b.paid > 0 || deposits[bidders[i]] > 0) {
                    uint256 refundAmount = b.paid - b.bidConfirmed + deposits[bidders[i]];
                    paymentToken.transfer(bidders[i], refundAmount);
                    b.paid = 0;
                    deposits[bidders[i]] = 0;
                    b.bidState = BidState.REFUNDED;
                    count++;
                }
            }
        }

        emit BidsUnselectedRefunded(count);
    }

    function updateState(AuctionState status) internal {
        auctionState = status;
        times[status] = block.timestamp;
    }

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Txn sender not admin");
        _;
    }

    modifier notExpired() {
        require(block.timestamp <= endTime, "Auction expired");
        _;
    }

    modifier onlyClientOrAdmin() {
        require(
            msg.sender == client || msg.sender == admin,
            "Txn sender not admin or client"
        );
        _;
    }
}
