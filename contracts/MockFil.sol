// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockFil is ERC20 {
    constructor(uint256 initialSupply) ERC20("MockFil", "MFL") {
        _mint(msg.sender, initialSupply);
        console.log("Deploying a token with owner: ", msg.sender);
    }
}