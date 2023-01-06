// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BDE_NFT is ERC721 {
    using Strings for uint256;
    using Counters for Counters.Counter;

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _bdeURIs;
    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("BigData Exchange", "BDE") {}

    function safeMint(address to) internal returns(uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        return tokenId;
    }

    function createBDENFT(string memory tokenUri_, address to_, address bdeAddr) external returns (uint256) {
        uint256 tokenId = safeMint(to_);
        _setTokenURI(tokenId, tokenUri_);
        _setBdeURI(tokenId, bdeAddr);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.tokenURI(tokenId);
    }

    function bdeURI(uint256 tokenId) public view  returns (address) {
        _requireMinted(tokenId);
        address _bdeURI = _bdeURIs[tokenId];
        return _bdeURI;
    }

     /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }


    /**
     * @dev Sets `_setBdeURI` as the _setBdeURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setBdeURI(uint256 tokenId, address _bdeAddr) internal {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _bdeURIs[tokenId] = _bdeAddr;
    }

    /**
     * @dev See {ERC721-_burn}. This override additionally checks to see if a
     * token-specific URI was set for the token, and if so, it deletes the token URI from
     * the storage mapping.
     */
    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
            delete _bdeURIs[tokenId];
        }
    }

}