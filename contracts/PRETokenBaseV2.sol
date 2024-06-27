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
 * 20.03.2024 - https://www.bitcore.sk - initial realease
 * 25.06.2024 - ability to change domain and version during upgrade (reinitializer)
 */

pragma solidity ^0.8.24;

//import { EnhancedEIP712Upgradeable } from "./EnhancedEIP712Upgradeable.sol";
import { PRETokenBase } from "./PRETokenBase.sol";

contract PRETokenBaseV2 is PRETokenBase {

    function reinitialize(string memory name, string memory version) public reinitializer(2) {
        super.__EIP712_init(name, version);
    }

}