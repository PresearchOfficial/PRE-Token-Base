// SPDX-License-Identifier: UNLICENSED
/**
 * @title Presearch Commom ERC20
 * @author Vladimir Klimo
 * @notice Presearch ERC20 Token for Optimism/Base network
 *
 */

pragma solidity ^0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { ILegacyMintableERC20, IOptimismMintableERC20 } from "@eth-optimism/contracts-bedrock/src/universal/IOptimismMintableERC20.sol";
import { ISemver } from "@eth-optimism/contracts-bedrock/src/universal/ISemver.sol";
import { AccessControlEnumerableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";
import { PresearchCommonERC20 } from "./PresearchCommonERC20.sol";
import { EIP3009 } from "./EIP3009.sol";


/**
 * @dev Presearch ERC20 Token for Optimism/Base network
 *
 * Supply capped at 1B tokens to match the maximum on Eth/PRETokenV3 contract
 * Only bridge could mint/burn the token on base/optimism L2 network
 * No minting is done during initialization
 */
contract PRETokenBase is PresearchCommonERC20, ILegacyMintableERC20, IOptimismMintableERC20, ISemver {

    /// @custom:storage-location erc7201:presearch.storage.PRETokenBase
    struct PRETokenBaseStorage {
        /// @notice Address of the corresponding version of this token on the remote chain.
        address _bridge;
        /// @notice Address of the StandardBridge on this network.
        address _remoteToken;
    }

    // keccak256(abi.encode(uint256(keccak256("presearch.storage.PRETokenBase")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant PRETokenBaseStorageLocation = 0x35739d423456d437635498f76bc453e9b5a4c66d2000ff83fe594195d3e30200;

    function _getPRETokenBaseStorage() private pure returns (PRETokenBaseStorage storage $) {
        assembly {
            $.slot := PRETokenBaseStorageLocation
        }
    }

    function initialize(string memory name, string memory symbol, address _bridge, address _remoteToken) public initializer {
        __Context_init_unchained();
        // token name and symbol initialization
        __ERC20_init_unchained(name, symbol);
        // max supply initialization 1 billion token 1000000000*10**18
        __ERC20Capped_init_unchained(1e27);
        // implementation of pauseable token
        __Pausable_init_unchained();
        // implementation of AccessControl
        __AccessControl_init_unchained();
        __AccessControlEnumerable_init_unchained();
        // EIP712 domain initialization
        //__EIP712_init_unchained(name, "1");
        // EIP9001 implementation of TransferAuthorizable
        // adds access control of TOKEN_TRANSFER_AUTHORIZE to contract owner during initialization
        __EIP3009_init_unchained();
        // inicialize underlying contract
        __PresearchCommonERC20_init_unchained();
        // initialize itself
        __PREToken_init_unchained(_bridge, _remoteToken);
    }

    function __PREToken_init_unchained(address _bridge, address _remoteToken) internal onlyInitializing {
        PRETokenBaseStorage storage $ = _getPRETokenBaseStorage();
        $._bridge = _bridge;
        $._remoteToken = _remoteToken;
    }
    
    /// @notice Semantic version.
    /// @custom:semver 1.3.0
    string public constant version = "1.3.0";

    /// @notice Emitted whenever tokens are minted for an account.
    /// @param account Address of the account tokens are being minted for.
    /// @param amount  Amount of tokens minted.
    event Mint(address indexed account, uint256 amount);

    /// @notice Emitted whenever tokens are burned from an account.
    /// @param account Address of the account tokens are being burned from.
    /// @param amount  Amount of tokens burned.
    event Burn(address indexed account, uint256 amount);

    /// @notice A modifier that only allows the bridge to call
    modifier onlyBridge() {
        PRETokenBaseStorage storage $ = _getPRETokenBaseStorage();
        require(_msgSender() == $._bridge, "PreTokenBase: only bridge can mint and burn");
        _;
    }

    /// @notice Allows the StandardBridge on this network to mint tokens.
    /// @param _to     Address to mint tokens to.
    /// @param _amount Amount of tokens to mint.
    function mint(
        address _to,
        uint256 _amount
    )
        external
        virtual
        override(IOptimismMintableERC20, ILegacyMintableERC20)
        onlyBridge
    {
        _mint(_to, _amount);
        emit Mint(_to, _amount);
    }

    /// @notice Allows the StandardBridge on this network to burn tokens.
    /// @param _from   Address to burn tokens from.
    /// @param _amount Amount of tokens to burn.
    function burn(
        address _from,
        uint256 _amount
    )
        external
        virtual
        override(IOptimismMintableERC20, ILegacyMintableERC20)
        onlyBridge
    {
        _burn(_from, _amount);
        emit Burn(_from, _amount);
    }

    /// @notice ERC165 interface check function.
    /// @param _interfaceId Interface ID to check.
    /// @return Whether or not the interface is supported by this contract.
    function supportsInterface(bytes4 _interfaceId) public view virtual override (AccessControlEnumerableUpgradeable, IERC165) returns (bool) {
        bytes4 iface1 = type(IERC165).interfaceId;
        // Interface corresponding to the legacy L2StandardERC20.
        bytes4 iface2 = type(ILegacyMintableERC20).interfaceId;
        // Interface corresponding to the updated OptimismMintableERC20 (this contract).
        bytes4 iface3 = type(IOptimismMintableERC20).interfaceId;
        return _interfaceId == iface1 || _interfaceId == iface2 || _interfaceId == iface3 || super.supportsInterface(_interfaceId);
    }

    /// @custom:legacy
    /// @notice Legacy getter for the remote token. Use REMOTE_TOKEN going forward.
    function l1Token() public view returns (address) {
        PRETokenBaseStorage storage $ = _getPRETokenBaseStorage();
        return $._remoteToken;
    }

    /// @custom:legacy
    /// @notice Legacy getter for the bridge. Use BRIDGE going forward.
    function l2Bridge() public view returns (address) {
        PRETokenBaseStorage storage $ = _getPRETokenBaseStorage();
        return $._bridge;
    }

    /// @custom:legacy
    /// @notice Legacy getter for REMOTE_TOKEN.
    function remoteToken() public view returns (address) {
        PRETokenBaseStorage storage $ = _getPRETokenBaseStorage();
        return $._remoteToken;
    }

    /// @custom:legacy
    /// @notice Legacy getter for BRIDGE.
    function bridge() public view returns (address) {
        PRETokenBaseStorage storage $ = _getPRETokenBaseStorage();
        return $._bridge;
    }

    uint256[50] private __gap;

}
