


import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import type { BNFT } from "../typechain-types";
import { ethers } from "hardhat";


describe("BNFT", () => {
  let bnft: BNFT;
  let owner: SignerWithAddress;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("BNFT", owner);
    bnft = (await factory.deploy()) as BNFT;
    await bnft.deployed();
  });


  describe("#test()", () => {
    it("should have the right owner", async () => {
      expect(await bnft.owner()).to.equal(owner.address)
    });
    it("should have the correct symbol", async () => {
      expect(await bnft.symbol()).to.equal("BNFT")
    });
  });
});

