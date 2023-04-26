// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

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
 *  BDX Data Collection Smart Contract
 */

contract BDX is ERC1155, ERC1155Burnable, Ownable, ERC1155Supply {
    struct Collection {
        uint256 volume;
        uint256 price;
        string uri;
        address owner;
        bool exist;
    }

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter =
        Counters.Counter({
            _value: 10000 // initial id;
        });
    uint256 public CreateFee = 1.99 * 10 ** 18;
    uint256 public MintFeePercent = 2;
    // tokenID => information;
    mapping(uint256 => Collection) public collections;

    event CollectionCreated(address _owner, uint256 _id);
    event DeleteCollectionCreated(uint256 _id);

    constructor() ERC1155("") {}

    function createCollection(
        uint256 price,
        uint256 total,
        string memory tokenURI
    ) public payable returns (uint256) {
        require(msg.value == CreateFee, "require MintFee");
        payable(owner()).transfer(CreateFee);
        uint256 tokenId = _tokenIdCounter.current();
        // mint 1 token to the owenr
        _mint(_msgSender(), tokenId, 1, "");
        collections[tokenId] = Collection({
            volume: total,
            price: price,
            uri: tokenURI,
            owner: _msgSender(),
            exist: true
        });
        _tokenIdCounter.increment();
        emit CollectionCreated(_msgSender(), tokenId);
        return tokenId;
    }

    function deleteCollection(uint256 id) external onlyOwner {
        Collection storage collection = collections[id];
        require(collection.exist, "Collection not exist");
        delete collections[id];
        emit DeleteCollectionCreated(id);
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public payable {
        Collection storage collection = collections[id];
        require(collection.exist, "Collection not exist");
        require(
            totalSupply(id) + amount <= collection.volume,
            "Exceed the volumn"
        );
        uint256 fee = (amount * (collection.price * MintFeePercent)) / 100;
        require(msg.value == amount * collection.price, "require MintFee");
        payable(owner()).transfer(fee);
        payable(collection.owner).transfer(amount * collection.price - fee);
        _mint(account, id, amount, data);
    }

    function uri(uint256 id) public view override returns (string memory) {
        Collection storage coll = collections[id];
        return coll.uri;
    }

    function setMintFeePercent(uint256 percent) external onlyOwner {
        MintFeePercent = percent;
    }

    function setCreateFee(uint256 fee) external onlyOwner {
        CreateFee = fee;
    }

    // Don't allow to mint batch.
    function mintBatch() public view onlyOwner {
        revert("Not allowed");
        // _mintBatch(to, ids, amounts, data);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
