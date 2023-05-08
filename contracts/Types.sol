//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

enum AuctionType {
    BID,
    FIXED,
    BOTH
}

enum BidType {
    BID,
    BUY_NOW
}

enum AuctionState {
    BIDDING,
    NO_BID_CANCELLED,
    SELECTION,
    VERIFICATION,
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
    uint256 bidConfirmed;
    BidState bidState;
}

interface IEventBus {
    function trigger(string memory _type) external;
}