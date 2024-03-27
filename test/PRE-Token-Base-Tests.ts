import { time, loadFixture, } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { PRETokenBase } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Presearch Token", function() {  
  let tokenAddress: string;
  let con: PRETokenBase;
  let owner: SignerWithAddress;
  let w1: SignerWithAddress;
  let w2: SignerWithAddress;

  before (async function () {
    const pre = await ethers.getContractFactory("PRETokenBase");
    //console.log("Deploying PRETokenBase...");
    const contract = await upgrades.deployProxy(pre, [
        "Presearch Token", 
        "PRE",
        '0x4200000000000000000000000000000000000010', // Standard Bridge address on L2 minting source
        '0xEC213F83defB583af3A000B1c0ada660b1902A0F' // presearch token address on L1
    ] );
    await contract.waitForDeployment();
    tokenAddress =  await contract.getAddress();
    console.log("V1 Contract deployed to:", tokenAddress);
    con = await ethers.getContractAt("PRETokenBase", tokenAddress);
    [owner, w1, w2] = await ethers.getSigners();
  });

  it('Check token/contract assigned name', async () => {
    expect((await con.name()).toString()).to.equal('Presearch Token');
  });

  it('Check symbol', async () => {
    expect((await con.symbol()).toString()).to.equal('PRE');
  });

  it('Check decimals', async () => {
    expect((await con.decimals()).toString()).to.equal('18');
  });

  it('Check total supply', async () => {
    const value =  await con.totalSupply() / BigInt(BigInt(10)**await con.decimals());
    expect(value.toString()).to.equal('500000000');
  });

  it('Check total MAX supply', async () => {
    const value =  await con.cap() / BigInt(BigInt(10)**await con.decimals());
    expect(value.toString()).to.equal('1000000000');    
  });

  it('Check bridge function', async () => {
    const value =  await con.bridge();
    expect(value.toString()).to.equal('0x4200000000000000000000000000000000000010');    
  });

  it('Check l2Bridge function', async () => {
    const value =  await con.l2Bridge();
    expect(value.toString()).to.equal('0x4200000000000000000000000000000000000010');    
  });

  it('Check l1Token function', async () => {
    const value =  await con.l1Token();
    expect(value.toString()).to.equal('0xEC213F83defB583af3A000B1c0ada660b1902A0F');    
  });

  it('Check remoteToken function', async () => {
    const value =  await con.remoteToken();
    expect(value.toString()).to.equal('0xEC213F83defB583af3A000B1c0ada660b1902A0F');    
  });

  it('Check transfer', async () => {
    const v1 = await con.balanceOf(w1.address);
    await con.connect(owner).transfer(w1.address, 100);
    const v2 = await con.balanceOf(w1.address);
    expect(v2-v1).to.equal(100);      
  });
  
  it('Check transferBatch', async () => {  
    const v1 = await con.balanceOf(w1.address);
    const v2 = await con.balanceOf(w2.address);
    await con.connect(owner).transferBatch([w1.address,w2.address], [100,100]);
    const b1 = await con.balanceOf(w1.address);
    const b2 = await con.balanceOf(w2.address);
    expect (b1-v1).to.equal(100);
    expect (b2-v2).to.equal(100);
  });

  it('Check transfer - INSUFFICIENT FUNDS', async () => {
    //console.log(val);
    var pom = con.connect(w2);
    await expect(
      pom.transfer(w1.address, 500)
    ).to.be.revertedWithCustomError(pom, "ERC20InsufficientBalance");
  });

  it('Pausing on', async () => {
    var pom = await con.pause();
    expect((await con.paused()).toString()).be.equal('true');
  });

  it('Transfers during paused contract', async () => {
    await expect( con.connect(owner).transfer(w1.address, 100)).to.be.revertedWithCustomError(con, "EnforcedPause");
  });

  it('Pausing off', async () => {
    var pom = await con.unpause();
    expect((await con.paused()).toString()).be.equal('false');
  });

  it('Pausing contract by NON-PAUSER_ROLE', async () => {
    var pom = con.connect(w1);
    await expect(pom.pause())
      .to.be.revertedWithCustomError(pom, 'AccessControlUnauthorizedAccount');
  });

  it('mint function from owner account', async () => {
    await expect(con.mint(owner.address, BigInt(1*10**18)))
      .to.be.rejectedWith('PreTokenBase: only bridge can mint and burn');
  });

  it('mint function from non-owner account', async () => {
    var pom = con.connect(w1);
    await expect(pom.mint(w1.address, BigInt(1*10**18)))
      .to.be.rejectedWith('PreTokenBase: only bridge can mint and burn');
  });

  it('burn function from owner account', async () => {
    await expect(con.burn(owner.address, BigInt(1*10**18)))
      .to.be.rejectedWith('PreTokenBase: only bridge can mint and burn');
  });

  it('burn function from non-owner account', async () => {
    var pom = con.connect(w1);
    await expect(pom.burn(w1.address, BigInt(1*10**18)))
      .to.be.rejectedWith('PreTokenBase: only bridge can mint and burn');
  });

  it('Check PAUSER_ROLE counts', async () => {
    const role = await con.PAUSER_ROLE();
    await expect(
        await con.getRoleMemberCount(role)
    ).be.equal('1');
  });

  it('Check getRoleAdmin function', async () => {
    const role = await con.PAUSER_ROLE();
    await expect(
        await con.getRoleAdmin(role)
    ).be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
  });

  it('Check DEFAULT_ADMIN_ROLE counts', async () => {
    const role = await con.DEFAULT_ADMIN_ROLE();
    await expect(
        await con.getRoleMemberCount(role)
    ).be.equal('1');
  });

  it('Check DEFAULT_ADMIN_ROLE getRoleAdmin function', async () => {
    const role = await con.DEFAULT_ADMIN_ROLE();
    await expect(
        await con.getRoleAdmin(role)
    ).be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
  });

  it('Check TRANSFER_AUTHORIZER_ROLE counts', async () => {
    const role = await con.TRANSFER_AUTHORIZER_ROLE();
    await expect(
        await con.getRoleMemberCount(role)
    ).be.equal('1');
  });

  it('Check TRANSFER_AUTHORIZER_ROLE getRoleAdmin function', async () => {
    const role = await con.DEFAULT_ADMIN_ROLE();
    await expect(
        await con.getRoleAdmin(role)
    ).be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
  });
  

});