import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { PRETokenBaseV3 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const BRIDGE_ADDRESS = "0x4200000000000000000000000000000000000010";
const L1_TOKEN_ADDRESS = "0xEC213F83defB583af3A000B1c0ada660b1902A0F";
const INITIAL_TEST_SUPPLY = ethers.parseUnits("500000000", 18);
const TOKEN_NAME = "Presearch";
const TOKEN_SYMBOL = "PRE";
const EIP712_VERSION = "1";

async function mintInitialTestSupply(con: any, to: string) {
  await ethers.provider.send("hardhat_setBalance", [BRIDGE_ADDRESS, "0xde0b6b3a7640000"]);
  await ethers.provider.send("hardhat_impersonateAccount", [BRIDGE_ADDRESS]);
  const bridge = await ethers.getSigner(BRIDGE_ADDRESS);
  await con.connect(bridge).mint(to, INITIAL_TEST_SUPPLY);
  await ethers.provider.send("hardhat_stopImpersonatingAccount", [BRIDGE_ADDRESS]);
}

async function signTransferAuthorization(
  con: PRETokenBaseV3,
  from: SignerWithAddress,
  to: string,
  value: bigint
) {
  const network = await ethers.provider.getNetwork();
  const tokenAddress = await con.getAddress();
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  const domain = {
    name: TOKEN_NAME,
    version: EIP712_VERSION,
    chainId: network.chainId,
    verifyingContract: tokenAddress,
  };
  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };
  const message = {
    from: from.address,
    to,
    value,
    validAfter: BigInt(0),
    validBefore,
    nonce,
  };

  const signature = await from.signTypedData(domain, types, message);

  return {
    validAfter: BigInt(0),
    validBefore,
    nonce,
    v: parseInt(signature.slice(130, 132), 16),
    r: signature.slice(0, 66),
    s: "0x" + signature.slice(66, 130),
  };
}

async function signReceiveAuthorization(
  con: PRETokenBaseV3,
  from: SignerWithAddress,
  to: string,
  value: bigint
) {
  const network = await ethers.provider.getNetwork();
  const tokenAddress = await con.getAddress();
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  const domain = {
    name: TOKEN_NAME,
    version: EIP712_VERSION,
    chainId: network.chainId,
    verifyingContract: tokenAddress,
  };
  const types = {
    ReceiveWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };
  const message = {
    from: from.address,
    to,
    value,
    validAfter: BigInt(0),
    validBefore,
    nonce,
  };

  const signature = await from.signTypedData(domain, types, message);

  return {
    validAfter: BigInt(0),
    validBefore,
    nonce,
    v: parseInt(signature.slice(130, 132), 16),
    r: signature.slice(0, 66),
    s: "0x" + signature.slice(66, 130),
  };
}

async function deployV3Fixture() {
  const [owner, w1, w2, w3] = await ethers.getSigners();
  const pre = await ethers.getContractFactory("PRETokenBase");
  const preV2 = await ethers.getContractFactory("PRETokenBaseV2");
  const preV3 = await ethers.getContractFactory("PRETokenBaseV3");

  const contract = await upgrades.deployProxy(pre, [
    TOKEN_NAME,
    TOKEN_SYMBOL,
    BRIDGE_ADDRESS,
    L1_TOKEN_ADDRESS,
  ]);
  await contract.waitForDeployment();

  const tokenAddress = await contract.getAddress();
  const upgradedV2 = await upgrades.upgradeProxy(tokenAddress, preV2);
  await upgradedV2.reinitialize(TOKEN_NAME, EIP712_VERSION);

  const conV2 = await ethers.getContractAt("PRETokenBaseV2", tokenAddress);
  await mintInitialTestSupply(conV2, owner.address);
  await conV2.connect(owner).transfer(w1.address, 1000);

  const expectedState = {
    totalSupply: await conV2.totalSupply(),
    ownerBalance: await conV2.balanceOf(owner.address),
    w1Balance: await conV2.balanceOf(w1.address),
    bridge: await conV2.bridge(),
    remoteToken: await conV2.remoteToken(),
    paused: await conV2.paused(),
    pauserRole: await conV2.PAUSER_ROLE(),
    defaultAdminRole: await conV2.DEFAULT_ADMIN_ROLE(),
    transferAuthorizerRole: await conV2.TRANSFER_AUTHORIZER_ROLE(),
    domain: await conV2.eip712Domain(),
  };

  const upgradedV3 = await upgrades.upgradeProxy(tokenAddress, preV3);
  await upgradedV3.waitForDeployment();
  const con = await ethers.getContractAt("PRETokenBaseV3", tokenAddress);

  return { con, tokenAddress, owner, w1, w2, w3, expectedState };
}

async function deployPausedV3Fixture() {
  const [owner] = await ethers.getSigners();
  const pre = await ethers.getContractFactory("PRETokenBase");
  const preV2 = await ethers.getContractFactory("PRETokenBaseV2");
  const preV3 = await ethers.getContractFactory("PRETokenBaseV3");

  const contract = await upgrades.deployProxy(pre, [
    TOKEN_NAME,
    TOKEN_SYMBOL,
    BRIDGE_ADDRESS,
    L1_TOKEN_ADDRESS,
  ]);
  await contract.waitForDeployment();

  const tokenAddress = await contract.getAddress();
  const upgradedV2 = await upgrades.upgradeProxy(tokenAddress, preV2);
  await upgradedV2.reinitialize(TOKEN_NAME, EIP712_VERSION);

  const conV2 = await ethers.getContractAt("PRETokenBaseV2", tokenAddress);
  await mintInitialTestSupply(conV2, owner.address);
  await conV2.pause();

  const upgradedV3 = await upgrades.upgradeProxy(tokenAddress, preV3);
  await upgradedV3.waitForDeployment();
  const con = await ethers.getContractAt("PRETokenBaseV3", tokenAddress);

  return { con };
}

describe("Presearch Token - version 03", function() {
  it("preserves V2 state during V3 upgrade", async () => {
    const { con, expectedState, w1 } = await loadFixture(deployV3Fixture);
    const domain = await con.eip712Domain();

    expect(await con.totalSupply()).to.equal(expectedState.totalSupply);
    expect(await con.balanceOf(w1.address)).to.equal(expectedState.w1Balance);
    expect(await con.bridge()).to.equal(expectedState.bridge);
    expect(await con.remoteToken()).to.equal(expectedState.remoteToken);
    expect(await con.paused()).to.equal(expectedState.paused);
    expect(domain[1]).to.equal(expectedState.domain[1]);
    expect(domain[2]).to.equal(expectedState.domain[2]);
    expect(await con.getRoleMemberCount(expectedState.pauserRole)).to.equal(1);
    expect(await con.getRoleMemberCount(expectedState.defaultAdminRole)).to.equal(1);
    expect(await con.getRoleMemberCount(expectedState.transferAuthorizerRole)).to.equal(1);
  });

  it("preserves paused state during V3 upgrade", async () => {
    const { con } = await loadFixture(deployPausedV3Fixture);

    expect(await con.paused()).to.equal(true);
  });

  it("allows PAUSER_ROLE to manage the blacklist", async () => {
    const { con, owner, w1, w2 } = await loadFixture(deployV3Fixture);

    await expect(con.connect(owner).setBlacklisted(w1.address, true))
      .to.emit(con, "BlacklistUpdated")
      .withArgs(w1.address, true);
    expect(await con.isBlacklisted(w1.address)).to.equal(true);

    await expect(con.connect(owner).setBlacklisted(w1.address, false))
      .to.emit(con, "BlacklistUpdated")
      .withArgs(w1.address, false);
    expect(await con.isBlacklisted(w1.address)).to.equal(false);

    await con.connect(owner).setBlacklistedBatch([w1.address, w2.address], true);
    expect(await con.isBlacklisted(w1.address)).to.equal(true);
    expect(await con.isBlacklisted(w2.address)).to.equal(true);
  });

  it("rejects blacklist management by non-pausers and the zero address", async () => {
    const { con, owner, w1 } = await loadFixture(deployV3Fixture);

    await expect(con.connect(w1).setBlacklisted(owner.address, true))
      .to.be.revertedWithCustomError(con, "AccessControlUnauthorizedAccount");
    await expect(con.connect(owner).setBlacklisted(ethers.ZeroAddress, true))
      .to.be.revertedWithCustomError(con, "InvalidBlacklistAddress");
    await expect(con.connect(owner).setBlacklistedBatch([w1.address, ethers.ZeroAddress], true))
      .to.be.revertedWithCustomError(con, "InvalidBlacklistAddress");
  });

  it("blocks direct outgoing transfers from blacklisted addresses", async () => {
    const { con, owner, w1, w2 } = await loadFixture(deployV3Fixture);

    await con.connect(owner).setBlacklisted(w1.address, true);

    await expect(con.connect(w1).transfer(w2.address, 1))
      .to.be.revertedWithCustomError(con, "BlacklistedAddress")
      .withArgs(w1.address);
  });

  it("blocks outgoing batch transfers from blacklisted addresses", async () => {
    const { con, owner, w1, w2, w3 } = await loadFixture(deployV3Fixture);

    await con.connect(owner).setBlacklisted(w1.address, true);

    await expect(con.connect(w1).transferBatch([w2.address, w3.address], [1, 1]))
      .to.be.revertedWithCustomError(con, "BlacklistedAddress")
      .withArgs(w1.address);
  });

  it("blocks transferFrom when the token owner is blacklisted", async () => {
    const { con, owner, w1, w2 } = await loadFixture(deployV3Fixture);

    await con.connect(owner).approve(w2.address, 100);
    await con.connect(owner).setBlacklisted(owner.address, true);

    await expect(con.connect(w2).transferFrom(owner.address, w1.address, 100))
      .to.be.revertedWithCustomError(con, "BlacklistedAddress")
      .withArgs(owner.address);
  });

  it("blocks transferWithAuthorization when from is blacklisted", async () => {
    const { con, owner, w1 } = await loadFixture(deployV3Fixture);
    const auth = await signTransferAuthorization(con, owner, w1.address, BigInt(100));

    await con.connect(owner).setBlacklisted(owner.address, true);

    await expect(con.transferWithAuthorization(
      owner.address,
      w1.address,
      BigInt(100),
      auth.validAfter,
      auth.validBefore,
      auth.nonce,
      auth.v,
      auth.r,
      auth.s
    ))
      .to.be.revertedWithCustomError(con, "BlacklistedAddress")
      .withArgs(owner.address);
  });

  it("blocks receiveWithAuthorization when from is blacklisted", async () => {
    const { con, owner, w1 } = await loadFixture(deployV3Fixture);
    const auth = await signReceiveAuthorization(con, owner, w1.address, BigInt(100));

    await con.connect(owner).setBlacklisted(owner.address, true);

    await expect(con.connect(w1).receiveWithAuthorization(
      owner.address,
      w1.address,
      BigInt(100),
      auth.validAfter,
      auth.validBefore,
      auth.nonce,
      auth.v,
      auth.r,
      auth.s
    ))
      .to.be.revertedWithCustomError(con, "BlacklistedAddress")
      .withArgs(owner.address);
  });

  it("allows blacklisted recipients to receive tokens", async () => {
    const { con, owner, w1 } = await loadFixture(deployV3Fixture);
    const beforeBalance = await con.balanceOf(w1.address);

    await con.connect(owner).setBlacklisted(w1.address, true);
    await con.connect(owner).transfer(w1.address, 100);

    expect(await con.balanceOf(w1.address)).to.equal(beforeBalance + BigInt(100));
  });

  it("keeps normal transfers working for non-blacklisted addresses", async () => {
    const { con, owner, w2 } = await loadFixture(deployV3Fixture);
    const beforeBalance = await con.balanceOf(w2.address);

    await con.connect(owner).transfer(w2.address, 100);

    expect(await con.balanceOf(w2.address)).to.equal(beforeBalance + BigInt(100));
  });
});
