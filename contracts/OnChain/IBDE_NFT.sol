// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, optional enumeration extension
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */
interface IBDE_NFT is IERC721 {
    function tokenURI(uint256 tokenId) external view  returns (string memory);

    function bdeURI(uint256 tokenId) external view  returns (address);

    function createBDENFT(string memory tokenUri_, address to_, address bdeAddr) external returns (uint256);
}