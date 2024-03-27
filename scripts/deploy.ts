import { ethers, upgrades } from "hardhat";

let tokenName: string = 'Presearch';
let tokenSymbol: string = 'PRE';

async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;
  let L1TokenAddress: string;

  // decides where to deploy and which tokens to inicialize contract with
  switch (networkName) {
    case 'base-sepolia': { L1TokenAddress = '0x0765C04EF390A63E8b7Bb6A5FCA2F42169C7bB19'; break; }
    case 'base-mainnet': { L1TokenAddress = '0xEC213F83defB583af3A000B1c0ada660b1902A0F'; break; }
    case 'optimism-mainnet': { L1TokenAddress = '0xEC213F83defB583af3A000B1c0ada660b1902A0F'; break; }
    default: { throw new TypeError('Unknown network for deployment'); break; }
  }
  
  const pre = await ethers.getContractFactory("PRETokenBase");
  console.log("Deploying PRETokenBase...");
  const proxy = await upgrades.deployProxy(pre, [
      tokenName, 
      tokenSymbol,
      '0x4200000000000000000000000000000000000010', // Standard Bridge address on L2 minting source
      L1TokenAddress // presearch token address on L1
  ] );
  await proxy.waitForDeployment();
  console.log("V1 Contract deployed to:", await proxy.getAddress());

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});