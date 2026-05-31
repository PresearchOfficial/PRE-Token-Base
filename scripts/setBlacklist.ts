import { ethers, network } from "hardhat";

function getProxyAddress(networkName: string): string {
  switch (networkName) {
    case "base":
    case "base-mainnet": {
      return "0x3816dD4bd44c8830c2FA020A5605bAC72FA3De7A";
    }
    case "base-sepolia": {
      return "0xc0C034725e4eC6DDd23B8D4e6412094BcfB3F5D6";
    }
    case "base-local":
    case "localhost": {
      return "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    }
    default: {
      throw new TypeError(`Unknown network for blacklist update: ${networkName}`);
    }
  }
}

function getBlacklistedValue(): boolean {
  const value = process.env.BLACKLISTED;

  if (value === undefined || value === "") {
    return true;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new TypeError("BLACKLISTED must be either true or false");
}

async function main() {
  const blacklistAddress = process.env.BLACKLIST_ADDRESS;

  if (!blacklistAddress) {
    throw new TypeError("BLACKLIST_ADDRESS env variable is required");
  }

  if (!ethers.isAddress(blacklistAddress)) {
    throw new TypeError("BLACKLIST_ADDRESS must be a valid address");
  }

  const blacklisted = getBlacklistedValue();
  const proxyAddress = getProxyAddress(network.name);
  const token = await ethers.getContractAt("PRETokenBaseV3", proxyAddress);

  console.log("Updating PRE blacklist...");
  console.log("Network:", network.name);
  console.log("Proxy:", proxyAddress);
  console.log("Account:", blacklistAddress);
  console.log("Blacklisted:", blacklisted);

  const tx = await token.setBlacklisted(blacklistAddress, blacklisted);
  console.log("Transaction:", tx.hash);
  await tx.wait();

  console.log("Updated blacklist state:", await token.isBlacklisted(blacklistAddress));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
