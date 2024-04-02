// SPDX-License-Identifier: UNLICENSED
/**
 * @title Presearch Commom ERC20
 * @author Vladimir Klimo
 * @notice Direct port of PRE Token V3 contract from solidity 0.6.2 to 0.8.24 with customizations for EIP3009 (previously PRETransferAuthorizableERC20.sol)
 * 
 */

pragma solidity ^0.8.24;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC20CappedUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { EIP3009 } from "./EIP3009.sol";

/**
 * @dev PresearchCommonERC20 is ported version of PRETokenV3 contract
 * MINTER_ROLE is not necessary as Base/Optimism L2 would utilize the native bridge to mint/burn token on L2
 * PAUSER_ROLE is implemented for security reason to stop/pause any transaction (red button case)
 * TRANSFER_AUTHORIZABLE_ROLE is set during EIP9001 inicialization 
 */
abstract contract PresearchCommonERC20 is Initializable, ERC20CappedUpgradeable, EIP3009, PausableUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function __PresearchCommonERC20_init_unchained() internal onlyInitializing {
        // initial setup of contract roles
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(PAUSER_ROLE, _msgSender());
    }

    /**
     * @dev See {ERC20-_update}.
     *
     * Requirements:
     *
     * - the contract must not be paused.
     */
    function _update(address from, address to, uint256 value) internal virtual override (ERC20CappedUpgradeable, ERC20Upgradeable) whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Hook that is called before a transfering tokens out of an account to one or more token holders
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransferBatch() internal virtual whenNotPaused { }    

    /**
     * @dev Send multiple transfers as a batch within a single transaction
     * This is much more efficient than sending independent transactions. 
     * This method should between 28% of gas (2 transfers) 
     * and 50%-60% of gas (10+ transfers)
     *
     * Calling conditions:
     *
     * Emits an {Transfer} event for each individual successful transfer.
     *
     * Requirements:
     *
     * - `recipients[]` length must equal  `amounts[]` length.
     * -  The amount to send `recipients[i]` must be at `amounts[i]`
     * - `recipient` cannot be the zero address.
     * - `balance` of the calling account must be >= the sum of values in `amounts` going to other accounts
     */
    function transferBatch(address[] calldata recipients, uint256[] calldata amounts) external virtual whenNotPaused returns (bool) {
        uint amtLenght = amounts.length; // optimization for gas
        // safety check
        require(recipients.length == amtLenght);

        address sender = _msgSender();
        // uint i = 0 by default (zero-state), no need for assignment of default value
        for (uint i; i < amtLenght; i++) {
            uint amount = amounts[i];
            address recipient = recipients[i];

            if(sender != recipient){            
                _transfer(sender, recipient, amount);
            }
        }
        return true;
    }

}