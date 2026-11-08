// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SchrodingersHamsterNFT
 * @notice Immutable ERC-721 NFT contract for Schrödinger's Hamster procedural hybrids.
 * @dev True immutability guarantee:
 *      - Once minted, tokenURI is permanent (no setTokenURI, no setBaseURI, no update functions).
 *      - Tokens cannot be upgraded (no proxy, no upgradeability).
 *      - Cryptographic commitments to canonical metadata and specimen hashes are permanently stored.
 *      - Minting requires a server-signed EIP-712 authorization to ensure only legitimate,
 *        unminted game hybrids are minted to the authorized recipient.
 *      - Replay attacks and duplicate specimen mints are strictly prevented.
 */
contract SchrodingersHamsterNFT is ERC721, EIP712, Ownable {
    using ECDSA for bytes32;

    // EIP-712 TypeHash for mint authorizations
    bytes32 public constant MINT_AUTHORIZATION_TYPEHASH = keccak256(
        "MintAuthorization(address recipient,uint256 tokenId,string tokenURI,bytes32 metadataHash,bytes32 specimenHash,uint256 nonce,uint256 deadline)"
    );

    /// @notice Authorized server signing address that approves mints
    address public authorizer;

    /// @notice Tracks specimen hashes that have already been minted (preventing duplicates)
    mapping(bytes32 => bool) public specimenMinted;

    /// @notice Tracks used nonces to prevent authorization replay
    mapping(uint256 => bool) public nonceUsed;

    /// @notice Permanent immutable token URIs
    mapping(uint256 => string) private _tokenURIs;

    /// @notice Cryptographic hash of the canonical metadata JSON at mint time
    mapping(uint256 => bytes32) public tokenMetadataHashes;

    /// @notice Cryptographic hash of the procedural specimen attributes
    mapping(uint256 => bytes32) public tokenSpecimenHashes;

    /// @notice Total count of successfully minted hamsters
    uint256 public totalMinted;

    // Events
    event HamsterMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        bytes32 indexed specimenHash,
        bytes32 metadataHash,
        string tokenURI
    );

    event AuthorizerUpdated(address indexed previousAuthorizer, address indexed newAuthorizer);

    // Custom errors for gas efficiency and clear reverts
    error InvalidRecipient();
    error AuthorizationExpired();
    error NonceAlreadyUsed();
    error SpecimenAlreadyMinted();
    error TokenAlreadyExists();
    error InvalidSignature();
    error EmptyTokenURI();
    error TokenDoesNotExist();

    /**
     * @notice Deploy the contract with an initial owner and authorized signer.
     * @param initialOwner Address of contract administrator (key management)
     * @param initialAuthorizer Address authorized to sign server mint authorizations
     */
    constructor(
        address initialOwner,
        address initialAuthorizer
    )
        ERC721("Schrodingers Hamster", "SQHAM")
        EIP712("Schrodingers Hamster", "1.0.0")
        Ownable(initialOwner)
    {
        require(initialAuthorizer != address(0), "Invalid authorizer");
        authorizer = initialAuthorizer;
    }

    /**
     * @notice Mint a procedural quantum hamster NFT using a server-signed EIP-712 authorization.
     * @param recipient The wallet receiving the minted NFT
     * @param tokenId The unique sequential token ID allocated to this specimen
     * @param uri The immutable IPFS metadata URI (ipfs://...)
     * @param metadataHash The cryptographic hash of the canonical metadata JSON
     * @param specimenHash The cryptographic hash of the specimen's persistent genome and traits
     * @param nonce Unique authorization nonce preventing replay
     * @param deadline Unix timestamp after which this authorization expires
     * @param signature The EIP-712 signature from the authorized server key
     */
    function mintWithAuthorization(
        address recipient,
        uint256 tokenId,
        string calldata uri,
        bytes32 metadataHash,
        bytes32 specimenHash,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (recipient == address(0)) revert InvalidRecipient();
        if (block.timestamp > deadline) revert AuthorizationExpired();
        if (nonceUsed[nonce]) revert NonceAlreadyUsed();
        if (specimenMinted[specimenHash]) revert SpecimenAlreadyMinted();
        if (bytes(uri).length == 0) revert EmptyTokenURI();

        // Verify EIP-712 typed signature
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_AUTHORIZATION_TYPEHASH,
                recipient,
                tokenId,
                keccak256(bytes(uri)),
                metadataHash,
                specimenHash,
                nonce,
                deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = digest.recover(signature);

        if (recoveredSigner != authorizer) revert InvalidSignature();

        // Mark state to prevent any duplicate mint or replay
        nonceUsed[nonce] = true;
        specimenMinted[specimenHash] = true;

        // Permanently record immutable metadata and hashes
        _tokenURIs[tokenId] = uri;
        tokenMetadataHashes[tokenId] = metadataHash;
        tokenSpecimenHashes[tokenId] = specimenHash;
        totalMinted += 1;

        // Safely mint token to recipient
        _safeMint(recipient, tokenId);

        emit HamsterMinted(tokenId, recipient, specimenHash, metadataHash, uri);
    }

    /**
     * @notice Return the permanently immutable metadata URI for a given token.
     * @dev Reverts if the token does not exist. There is NO setTokenURI or setBaseURI.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    /**
     * @notice Update the authorized server signing address (for server key rotation).
     * @dev Does NOT alter any already-minted tokens, their metadata, or their ownership.
     */
    function setAuthorizer(address newAuthorizer) external onlyOwner {
        require(newAuthorizer != address(0), "Invalid authorizer");
        address old = authorizer;
        authorizer = newAuthorizer;
        emit AuthorizerUpdated(old, newAuthorizer);
    }
}
