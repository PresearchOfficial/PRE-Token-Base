# Presearch Token for Base/Optimism network

Presearch ERC-20 Token. Deployed on the Base Sepolia at
**Token Address**: [0xc0C034725e4eC6DDd23B8D4e6412094BcfB3F5D6](https://sepolia.basescan.org/token/0xc0c034725e4ec6ddd23b8d4e6412094bcfb3f5d6)

Presearch ERC-20 Token. Deployed on the Base Mainnet at
**Token Address**: [0x3816dD4bd44c8830c2FA020A5605bAC72FA3De7A](https://basescan.org/token/0x3816dD4bd44c8830c2FA020A5605bAC72FA3De7A)

## Overview
This is the source code for the PRE Token Base/Optimism, which powers the Presearch platform at https://presearch.com

The smart contract provides a secure and upgradeable token, which will ultimately enable fully decentralized governance over all utility of the token during phase III of the project. To learn more about Presearch, our plans, and the role of the PRE token, please see our Vision Paper:
https://presearch.io/vision.pdf

## Contract Audits
List of PRE token contract audits for Base network.

### Initial audit 
PRE Token Base smart contract was audited by MantisecLabs from March 28th till April 4th, 2024 (based on initial commit e3f8792 and revalidtion commit db3b0ce).

- MantisecLabs checked all aspects related to the ERC20 standard compatibility and other known ERC20 pitfalls/vulnerabilities, and no issues were found in these areas.
- MantisecLabs also examined other areas such as coding practices and business logic. 1 High priority finding were found in EIP3009.sol function CancelAuthorization, which was a typo during rewritting contract for solidity 0.8.24.
- Overall, MantisecLabs reported also 3 Low priority findings related to gas optimizations of contract execution.

Presearch implemented fix for typo in CancelAuthorization (High priority finding) and all of the Low priority findings of MantisecLabs on April 3rd, 2024 (commit db3b0ce) prior to deploying the token smart contract on April 04th, 2024 to Base Mainnet.

The final audit report reflecting the token deployment was completed on April 04th, 2024 and can be found in the audit folder: [PRE Token Base Smart Contract Audit Report](/audits/PRE-Base%20Audit%20Final.pdf).

### V2 audit
PRE Token smart contract V2 for Base network was audited by MantisecLabs from June 26th till July 03rd, 2024 (source for the audit was commit at d909b4c and revalidation commit 599ccaa).

- MantisecLabs checked the PRETokenBaseV2 contract and changes related to EIP3009 contract with general best practices and smart contract security.
- MantisecLabs reported 2 Low priority findings related to missing _gap storage space and introduction of additional layer of security with ReentrancyGuard.

Presearch implemented fix for both (2) Low priority findings on July 9th, 2024 (commit 599ccaa) prior to deploying the V2 PRE token smart contract on July 10th, 2024 to Base Mainnet.

The V2 final audit report reflecting the token deployment was completed on July 10th, 2024 and can be found in audit folder: [PRE V2 Token Base Smart Contract Audit Report](/audits/PRE-Base%20V2%20Audit%20Final.pdf)


## Setup
1. run `npm install hardhat -g`
2. run `npm install`
3. run `hardhat compile`

## Local Testing
1. run `hardhat compile --all`
2. run `hardhat test`

BTW contract itself does not mint any tokens by default so for testing of the contract features/functionality its good to mint some tokens during initialization or utilize the native bridge functionality of its more convenient