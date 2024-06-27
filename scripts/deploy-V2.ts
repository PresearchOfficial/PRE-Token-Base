import { ethers, upgrades } from "hardhat";

let tokenName: string = 'Presearch';
let tokenSymbol: string = 'PRE';

async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;
  let PROXY_ADDRESS: string;

  // get fixed/optimized PRETokenBase after audit
  const pre = await ethers.getContractFactory("PRETokenBaseV2");
  console.log("Re-Deploying PRETokenBaseV2 ...");

  // base deployed transparent PROXY address
  switch (networkName) {
    case 'base-mainnet': { PROXY_ADDRESS = '0x3816dD4bd44c8830c2FA020A5605bAC72FA3De7A'; break; }
    case 'base-sepolia': { PROXY_ADDRESS = '0xc0C034725e4eC6DDd23B8D4e6412094BcfB3F5D6'; break; }
    case 'localhost': { PROXY_ADDRESS = '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1'; break; }
    default: { throw new TypeError('Unknown network for deployment'); break; }
  }

  // execute the upgrade
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, pre);
  console.log("Reinitializing...");
  await upgraded.reinitialize('Presearch', '1');
  console.log("Upgrade and reinitialization complete!");

  // log output
  console.log("V2 Contract deployed / upgraded to:", await upgraded.getAddress());
  console.log(await upgrades.erc1967.getImplementationAddress(await upgraded.getAddress())," getImplementationAddress");
  console.log(await upgrades.erc1967.getAdminAddress(await upgraded.getAddress()), " getAdminAddress");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});