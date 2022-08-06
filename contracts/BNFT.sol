// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./IBTRST.sol";

contract BraintrustMembershipNFT is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;
    address public relayer;
    string public baseURI;

    IBTRST btrstErc20;
    mapping(address => Profile) public unlockedDeposits;
    mapping(address => Profile[]) public lockedDeposits;

    struct Profile {
        uint256 nftTokenId;
        uint256 btrstAmount;
        uint256 available;
        uint256 externalId;
    }

    //errors
    error OnlyRelayerAllowed();
    error Debug(uint256 code, string message);
    error NftDoesNotBelongToBeneficiary(
        uint256 nftTokenId,
        address beneficiary
    );
    error NoMembershipNftInWallet(address beneficiary);
    error LockPeriodNotReached();
    error InsufficientBalance();
    error TransferNotAllowed();

    //events
    event NftMinted(address indexed sender, uint256 amount, uint256 externalId);
    event Deposited(address indexed sender, uint256 amount, uint256 externalId);
    event DepositLocked(
        address indexed sender,
        uint256 amount,
        uint256 externalId
    );
    event UnlockedDepositWithdrawn(address indexed sender, uint256 amount);
    event LockedDepositWithdrawn(
        address indexed sender,
        uint256 amount,
        uint256 index
    );

    // modifiers
    modifier onlyRelayer() {
        if (msg.sender != relayer) {
            revert OnlyRelayerAllowed();
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _relayer,
        address _btrstErc20,
        string memory _baseURL
    ) public initializer {
        __ERC721_init("Braintrust Membership NFT", "BNFT");
        __Ownable_init();
        __UUPSUpgradeable_init();

        relayer = _relayer;
        btrstErc20 = IBTRST(_btrstErc20);
        setBaseURI(_baseURL);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        // NFT cannot be transfered across wallets. Only mint is enabled.
        if (from != address(0)) {
            revert TransferNotAllowed();
        }

        super._beforeTokenTransfer(from, to, tokenId);
    }

    function setBaseURI(string memory newURI) public onlyOwner {
        baseURI = newURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function safeMint(address to, uint256 externalId) public onlyRelayer {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        emit NftMinted(to, tokenId, externalId);
    }

    // Done by user. User must approve BTRST contract for allowed amount
    function deposit(
        uint256 amount,
        uint256 nftTokenId,
        address beneficiary,
        uint256 externalId
    ) external {
        if (balanceOf(msg.sender) <= 0) {
            revert NoMembershipNftInWallet(beneficiary);
        }

        if (ownerOf(nftTokenId) != beneficiary) {
            revert NftDoesNotBelongToBeneficiary(nftTokenId, beneficiary);
        }

        // we only set nft id once, but increment deposit amount every time.
        // available is always left as 0, since there is no unlock time for unlocked deponsits.
        if (unlockedDeposits[beneficiary].nftTokenId == 0) {
            unlockedDeposits[beneficiary].nftTokenId = nftTokenId;
        }

        if (unlockedDeposits[beneficiary].externalId == 0) {
            unlockedDeposits[beneficiary].externalId = externalId;
        }

        unlockedDeposits[beneficiary].btrstAmount += amount;
        btrstErc20.transferFrom(beneficiary, address(this), amount);
        emit Deposited(beneficiary, amount, externalId);
    }

    // Done by relayer. No need for approval, since relayer has access to BTRST
    function lock(
        uint256 amount,
        uint256 nftTokenId,
        address beneficiary,
        uint256 availableTimeInSeconds,
        uint256 externalId
    ) external {
        if (balanceOf(beneficiary) <= 0) {
            revert NoMembershipNftInWallet(beneficiary);
        }

        // check that nft belongs to beneficiary
        if (ownerOf(nftTokenId) != beneficiary) {
            revert NftDoesNotBelongToBeneficiary(nftTokenId, beneficiary);
        }

        uint256 available = availableTimeInSeconds + block.timestamp;
        lockedDeposits[beneficiary].push(
            Profile(nftTokenId, amount, available, externalId)
        );
        btrstErc20.transferFrom(msg.sender, address(this), amount);
        emit DepositLocked(beneficiary, amount, externalId);
    }

    // Done by user
    function withdrawUnlockedDeposit(uint256 amount) external {
        // check if user has enlught deposit, they can withdraw
        if (amount > unlockedDeposits[msg.sender].btrstAmount) {
            revert InsufficientBalance();
        }

        unlockedDeposits[msg.sender].btrstAmount -= amount;
        btrstErc20.transferFrom(address(this), msg.sender, amount);

        emit UnlockedDepositWithdrawn(msg.sender, amount);
    }

    // Done by user
    function withdrawLockedDeposit(uint256 amount, uint256 withdrawalIndex)
        external
    {
        // check that available time has reached for that withdrawal index
        if (
            block.timestamp <
            lockedDeposits[msg.sender][withdrawalIndex].available
        ) {
            revert LockPeriodNotReached();
        }
        // check if user has enlught deposit, they can withdraw
        if (amount > lockedDeposits[msg.sender][withdrawalIndex].btrstAmount) {
            revert InsufficientBalance();
        }

        lockedDeposits[msg.sender][withdrawalIndex].btrstAmount -= amount;
        uint256 len = lockedDeposits[msg.sender].length;
        // if btstamount is now zero, then delete it from mapping
        if (lockedDeposits[msg.sender][withdrawalIndex].btrstAmount == 0) {
            lockedDeposits[msg.sender][withdrawalIndex] = lockedDeposits[
                msg.sender
            ][len - 1];
            lockedDeposits[msg.sender].pop();
        }

        btrstErc20.transferFrom(address(this), msg.sender, amount);

        emit LockedDepositWithdrawn(msg.sender, amount, withdrawalIndex);
    }

    //getTotalUnlockedDeposit
    function getTotalUnlockedDeposit(address _address)
        public
        view
        returns (uint256)
    {
        return unlockedDeposits[_address].btrstAmount;
    }

    //getTotalLockedDeposit
    function getLockedDepositByIndex(address _address, uint256 index)
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        Profile memory _lockedDeposit = lockedDeposits[_address][index];
        return (
            _lockedDeposit.nftTokenId,
            _lockedDeposit.btrstAmount,
            _lockedDeposit.available,
            _lockedDeposit.externalId
        );
    }

    function getTotalLockedDepositAmount(address _address)
        public
        view
        returns (uint256 total)
    {
        uint256 len = lockedDeposits[_address].length;

        for (uint256 i = 0; i < len; i++) {
            Profile memory _lockedDeposit = lockedDeposits[_address][i];
            total += _lockedDeposit.btrstAmount;
        }

        return total;
    }

    function getTotalLockedDepositByAddress(address _address)
        public
        view
        returns (
            uint256[] memory nftTokenTokenIds,
            uint256[] memory btrstAmounts,
            uint256[] memory availableTimes,
            uint256[] memory externalIds
        )
    {
        uint256 len = lockedDeposits[_address].length;
        nftTokenTokenIds = new uint256[](len);
        btrstAmounts = new uint256[](len);
        availableTimes = new uint256[](len);
        externalIds = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            Profile memory _lockedDeposit = lockedDeposits[_address][i];
            nftTokenTokenIds[i] = _lockedDeposit.nftTokenId;
            btrstAmounts[i] = _lockedDeposit.btrstAmount;
            availableTimes[i] = _lockedDeposit.available;
            externalIds[i] = _lockedDeposit.externalId;
        }

        return (nftTokenTokenIds, btrstAmounts, availableTimes, externalIds);
    }
}
