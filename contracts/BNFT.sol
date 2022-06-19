// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract BNFT is ERC721Enumerable, Ownable {
    constructor() ERC721("Braintrust NFT", "BNFT") {}
}
