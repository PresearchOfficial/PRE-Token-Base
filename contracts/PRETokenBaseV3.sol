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
 */

pragma solidity ^0.8.24;

import { PRETokenBaseV2 } from "./PRETokenBaseV2.sol";

contract PRETokenBaseV3 is PRETokenBaseV2 {
    /// @custom:storage-location erc7201:presearch.storage.PRETokenBaseV3
    struct PRETokenBaseV3Storage {
        mapping(address => bool) _blacklisted;
    }

    // keccak256(abi.encode(uint256(keccak256("presearch.storage.PRETokenBaseV3")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant PRETokenBaseV3StorageLocation = 0x718535a716b7d111eaaa0d364f255bcc8f821ecc1bc423d13926c63c85ae8600;

    event BlacklistUpdated(address indexed account, bool blacklisted);

    error BlacklistedAddress(address account);
    error InvalidBlacklistAddress();

    function _getPRETokenBaseV3Storage() private pure returns (PRETokenBaseV3Storage storage $) {
        assembly {
            $.slot := PRETokenBaseV3StorageLocation
        }
    }

    function isBlacklisted(address account) external view returns (bool) {
        return _isBlacklisted(account);
    }

    function _isBlacklisted(address account) internal view returns (bool) {
        PRETokenBaseV3Storage storage $ = _getPRETokenBaseV3Storage();
        return $._blacklisted[account];
    }

    function setBlacklisted(address account, bool blacklisted) external onlyRole(PAUSER_ROLE) {
        _setBlacklisted(account, blacklisted);
    }

    function setBlacklistedBatch(address[] calldata accounts, bool blacklisted) external onlyRole(PAUSER_ROLE) {
        uint accountsLength = accounts.length;
        for (uint i; i < accountsLength; i++) {
            _setBlacklisted(accounts[i], blacklisted);
        }
    }

    function _setBlacklisted(address account, bool blacklisted) internal {
        if (account == address(0)) {
            revert InvalidBlacklistAddress();
        }

        PRETokenBaseV3Storage storage $ = _getPRETokenBaseV3Storage();
        $._blacklisted[account] = blacklisted;
        emit BlacklistUpdated(account, blacklisted);
    }

    function _update(address from, address to, uint256 value) internal virtual override {
        if (from != address(0) && _isBlacklisted(from)) {
            revert BlacklistedAddress(from);
        }

        super._update(from, to, value);
    }

    uint256[50] private __gap;
}
