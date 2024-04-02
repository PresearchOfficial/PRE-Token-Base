/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2020 CENTRE SECZ
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Ported to 0.8.24 solidity by Vladimir Klimo, bitCore,s.r.o.
 * 20.03.2024 - https://www.bitcore.sk
 */

pragma solidity ^0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { ContextUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
// library imports
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
// implementation of EIP712Upgradeable
import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { EIP712Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import { AccessControlEnumerableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";


/**
 * @title Presearch Commom ERC20
 * @author Vladimir Klimo
 * @notice Direct port of PRE Token V3 contract from solidity 0.6.2 to 0.8.24 with customizations for EIP3009 (previously PRETransferAuthorizableERC20.sol)
 * 
 * @dev Implementation of EIP3009
 * Modification for DOMAIN_SEPARATOR library was handled by using internal generator for domain separator of EIP712Upgradeable
 * main EIP3009 contract is extended with AccessControl and allow only TRANSFER_AUTHORIZABLE_ROLE members (preferably contracts)
 * execute any authorized withdrawals/transfers
 */
abstract contract EIP3009 is ContextUpgradeable, EIP712Upgradeable, ERC20Upgradeable, AccessControlEnumerableUpgradeable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant TRANSFER_AUTHORIZER_ROLE = keccak256("TRANSFER_AUTHORIZER_ROLE");

    function __EIP3009_init(string memory name, string memory symbol) internal onlyInitializing {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __EIP712_init_unchained(name, "1" );
        __AccessControl_init_unchained();
    }

    function __EIP3009_init_unchained() internal onlyInitializing {
        _grantRole(TRANSFER_AUTHORIZER_ROLE, _msgSender());
    }        

    // keccak256("TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = 0x7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267;

    // keccak256("ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
    bytes32 public constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH = 0xd099cc98ef71107a616c4f0f941f04c322d8e254fe26b3c6668db87aae413de8;

    // keccak256("CancelAuthorization(address authorizer,bytes32 nonce)")
    bytes32 public constant CANCEL_AUTHORIZATION_TYPEHASH = 0x158b0a9edf7a828aad02f63cd515c68ef2f50ba807396f6d12842833a1597429;

    /// @custom:storage-location erc7201:presearch.storage.EIP3009
    struct EIP3009Storage {
        /**
         * @dev authorizer address => nonce => state (true = used / false = unused)
         */
        mapping(address => mapping(bytes32 => bool)) _authorizationStates;
    }

    // keccak256(abi.encode(uint256(keccak256("presearch.storage.EIP3009")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant EIP3009StorageLocation = 0x0fae7fd1e948b6363bc5aba5e60657e65fd95b9e72b5c603d8c881e38e715b00;

    function _getEIP3009Storage() private pure returns (EIP3009Storage storage $) {
        assembly {
            $.slot := EIP3009StorageLocation
        }
    }

    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
    event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);

    string internal constant _INVALID_SIGNATURE_ERROR = "EIP3009: invalid signature";
    string internal constant _AUTHORIZATION_USED_ERROR = "EIP3009: authorization is used";
    string internal constant _CALLER_MUST_BE_PAYEEE_ERROR = "EIP3009: caller must be the payee";
    string internal constant _AUTHORIZATION_NOT_YET_VALID_ERROR = "EIP3009: authorization is not yet valid";
    string internal constant _AUTHORIZATION_EXPIRED_ERROR = "EIP3009: authorization is expired";

    /**
     * @dev Ported function to provide same interfaces as PRE Token V3 contract on L1 for signing
     * @notice This is part of the EIP712Upgradable
     * @return domain separator for signing purposes
     */
    function getDomainSeparator() external view returns(bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Returns the state of an authorization
     * @dev Nonces are randomly generated 32-byte data unique to the authorizer's
     * address
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @return True if the nonce is used
     */
    function authorizationState(address authorizer, bytes32 nonce) external view returns (bool) {
        EIP3009Storage storage $ = _getEIP3009Storage();
        return $._authorizationStates[authorizer][nonce];
    }

    /**
     * @notice Execute a transfer with a signed authorization
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual onlyRole(TRANSFER_AUTHORIZER_ROLE) {
        _transferWithAuthorization(
            TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );
    }

    /**
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address matches
     * the caller of this function to prevent front-running attacks. (See security
     * considerations)
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual onlyRole(TRANSFER_AUTHORIZER_ROLE) {
        require(to == _msgSender(), _CALLER_MUST_BE_PAYEEE_ERROR);

        _transferWithAuthorization(
            RECEIVE_WITH_AUTHORIZATION_TYPEHASH,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );
    }

    /**
     * @notice Attempt to cancel an authorization
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual onlyRole(TRANSFER_AUTHORIZER_ROLE) {
        EIP3009Storage storage $ = _getEIP3009Storage();
        require(
            !$._authorizationStates[authorizer][nonce],
            _AUTHORIZATION_USED_ERROR
        );

        bytes32 data = keccak256(abi.encode(
            CANCEL_AUTHORIZATION_TYPEHASH,
            authorizer,
            nonce
        ));
        bytes32 typedDataHash = MessageHashUtils.toTypedDataHash( _domainSeparatorV4(), data);

        require(
            ECDSA.recover( typedDataHash, v, r, s) == authorizer,
            _INVALID_SIGNATURE_ERROR
        );

        $._authorizationStates[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }

    function _transferWithAuthorization(
        bytes32 typeHash,
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        EIP3009Storage storage $ = _getEIP3009Storage();
        require(block.timestamp > validAfter, _AUTHORIZATION_NOT_YET_VALID_ERROR);
        require(block.timestamp < validBefore, _AUTHORIZATION_EXPIRED_ERROR);
        require(!$._authorizationStates[from][nonce], _AUTHORIZATION_USED_ERROR);

        bytes32 data = keccak256(abi.encode(
            typeHash,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce
        ));
        bytes32 typedDataHash = MessageHashUtils.toTypedDataHash( _domainSeparatorV4(), data);

        require(
            ECDSA.recover( typedDataHash, v, r, s) == from,
            _INVALID_SIGNATURE_ERROR
        );

        $._authorizationStates[from][nonce] = true;
        emit AuthorizationUsed(from, nonce);

        _transfer(from, to, value);
    }
}