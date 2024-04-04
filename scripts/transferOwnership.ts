import { ethers, upgrades } from "hardhat";

async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;

  // target multisig wallet
  const multisigWallet = '0xBCac0a86127e666dba2e9cDF0ABdA6F04B272E49';

  //const PROXY_ADDRESS = '0xc0C034725e4eC6DDd23B8D4e6412094BcfB3F5D6'; // PRE Token Base Sepolia contract Proxy Address
  const PROXY_ADDRESS = '0x3816dD4bd44c8830c2FA020A5605bAC72FA3De7A'; // PRE Token Base contract Proxy Address

  const proxyAdmin = await upgrades.erc1967.getAdminAddress(PROXY_ADDRESS);

  console.log('Transferring ownership of ProxyAdmin...');
  // The owner of the ProxyAdmin can upgrade our contracts
  await upgrades.admin.transferProxyAdminOwnership(proxyAdmin, multisigWallet);
  console.log('Transferred ownership of ProxyAdmin to:', multisigWallet);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});