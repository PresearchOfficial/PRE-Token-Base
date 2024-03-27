# Presearch Token for Base/Optimism network

Presearch ERC-20 Token. Deployed on the Base Sepolia at  
**Token Address**: [0xc0C034725e4eC6DDd23B8D4e6412094BcfB3F5D6](https://sepolia.basescan.org/token/0xc0c034725e4ec6ddd23b8d4e6412094bcfb3f5d6)

Presearch ERC-20 Token. Deployed on the Base Mainnet at  
**Token Address**: TBD

## Overview
This is the source code for the PRE Token Base/Optimism, which powers the Presearch platform at https://presearch.com

The smart contract provides a secure and upgradeable token, which will ultimately enable fully decentralized governance over all utility of the token during phase III of the project. To learn more about Presearch, our plans, and the role of the PRE token, please see our Vision Paper:
https://presearch.io/vision.pdf

## Audit
TBD


## Setup
1. run `npm install hardhat -g`
2. run `npm install`
3. run `hardhat compile`

## Local Testing
1. run `hardhat compile --all`
2. run `hardhat test`

BTW contract itself does not mint any tokens by default so for testing of the contract features/functionality its good to mint some tokens during inicialization or utilize the native bridge functionality of its more convenient