import { ethers, network, upgrades } from "hardhat";

const PROXY_ADMIN_ABI = [
  "function owner() view returns (address)",
  "function UPGRADE_INTERFACE_VERSION() view returns (string)",
  "function upgrade(address proxy, address implementation)",
  "function upgradeAndCall(address proxy, address implementation, bytes data)",
];

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
      throw new TypeError(`Unknown network for V3 deployment: ${networkName}`);
    }
  }
}

async function getProxyAdminUpgradeCall(proxyAddress: string, implementationAddress: string) {
  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
  const proxyAdmin = new ethers.Contract(proxyAdminAddress, PROXY_ADMIN_ABI, ethers.provider);
  const proxyAdminInterface = new ethers.Interface(PROXY_ADMIN_ABI);

  let upgradeInterfaceVersion: string | undefined;
  try {
    upgradeInterfaceVersion = await proxyAdmin.UPGRADE_INTERFACE_VERSION();
  } catch {
    upgradeInterfaceVersion = undefined;
  }

  if (upgradeInterfaceVersion === "5.0.0") {
    return {
      proxyAdminAddress,
      functionName: "upgradeAndCall(address,address,bytes)",
      data: proxyAdminInterface.encodeFunctionData("upgradeAndCall", [
        proxyAddress,
        implementationAddress,
        "0x",
      ]),
    };
  }

  return {
    proxyAdminAddress,
    functionName: "upgrade(address,address)",
    data: proxyAdminInterface.encodeFunctionData("upgrade", [
      proxyAddress,
      implementationAddress,
    ]),
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const proxyAddress = getProxyAddress(network.name);
  const preV2 = await ethers.getContractFactory("PRETokenBaseV2");
  const preV3 = await ethers.getContractFactory("PRETokenBaseV3");

  console.log("Preparing PRETokenBaseV3 upgrade...");
  console.log("Network:", network.name);
  console.log("Signer:", deployer.address);
  console.log("Proxy:", proxyAddress);

  await upgrades.forceImport(proxyAddress, preV2, { kind: "transparent" });
  console.log("Proxy imported as PRETokenBaseV2 for layout validation.");

  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
  const proxyAdmin = new ethers.Contract(proxyAdminAddress, PROXY_ADMIN_ABI, ethers.provider);
  const proxyAdminOwner = await proxyAdmin.owner();

  console.log("ProxyAdmin:", proxyAdminAddress);
  console.log("ProxyAdmin owner:", proxyAdminOwner);
  console.log("Current implementation:", await upgrades.erc1967.getImplementationAddress(proxyAddress));

  if (proxyAdminOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    const preparedImplementation = await upgrades.prepareUpgrade(proxyAddress, preV3);

    if (typeof preparedImplementation !== "string") {
      throw new TypeError("Expected prepareUpgrade to return the implementation address");
    }

    const implementationAddress = ethers.getAddress(preparedImplementation);
    const upgradeCall = await getProxyAdminUpgradeCall(proxyAddress, implementationAddress);

    console.log("ProxyAdmin is owned by another account. Direct upgrade was not sent.");
    console.log("Submit this transaction from the ProxyAdmin owner / Safe:");
    console.log("To:", upgradeCall.proxyAdminAddress);
    console.log("Value:", "0");
    console.log("Function:", upgradeCall.functionName);
    console.log("Data:", upgradeCall.data);
    console.log("New implementation:", implementationAddress);
    return;
  }

  const upgraded = await upgrades.upgradeProxy(proxyAddress, preV3);
  await upgraded.waitForDeployment();

  const upgradedAddress = await upgraded.getAddress();
  console.log("V3 Contract deployed / upgraded to:", upgradedAddress);
  console.log(await upgrades.erc1967.getImplementationAddress(upgradedAddress), "getImplementationAddress");
  console.log(await upgrades.erc1967.getAdminAddress(upgradedAddress), "getAdminAddress");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
