import { Contract, Signer } from 'ethers';


import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import type { BraintrustMembershipNFT, BTRST } from "../typechain-types";
import { ethers, upgrades } from "hardhat";
import { DAY, simulateTimeTravel, toBigNumber } from "./utility";

describe("BNFT", () => {
  let bnftContractOwner: SignerWithAddress;
  let relayer: SignerWithAddress;
  let freelancer: SignerWithAddress;
  let randomSigner: SignerWithAddress;
  let btrstContractOwner: SignerWithAddress;
  const baseURL = "http:ipfs/";

  let btrst: BTRST;
  let bnft: Contract;

  let externalId: BigNumber;

  beforeEach(async () => {

    const signers = await ethers.getSigners();
    bnftContractOwner = signers[0];
    relayer = signers[1];
    btrstContractOwner = signers[2];
    freelancer = signers[3];
    randomSigner = signers[4];

    const braintrustMembershipNFTFactory = await ethers.getContractFactory("BraintrustMembershipNFT", bnftContractOwner);
    const BtrstFactory = await ethers.getContractFactory("BTRST", bnftContractOwner);

    btrst = (await BtrstFactory.deploy(btrstContractOwner.address)) as BTRST;
    await btrst.deployed();

    bnft = await upgrades.deployProxy(braintrustMembershipNFTFactory, [relayer.address, btrst.address, baseURL]);
    await bnft.deployed();

    externalId = toBigNumber(Math.floor((Math.random() * 60000) + 1)); //Return a random number between 1 and 60000:
  });


  describe("#test()", () => {
    describe("#constructor()", () => {
      it("should have the right owner", async () => {
        expect(await bnft.owner()).to.equal(bnftContractOwner.address)
      });
      it("should have the correct symbol", async () => {
        expect(await bnft.symbol()).to.equal("BNFT")
      });
    });

    describe("#setBaseURI()", () => {

      it("should allow owner to set BaseURL", async () => {
        await bnft.connect(bnftContractOwner).setBaseURI("http://bar/");
        expect(await bnft.baseURI()).to.be.eq(`http://bar/`)
      });

      it("should not allow a random address to se tBaseURL", async () => {
        await expect(bnft.connect(randomSigner).setBaseURI("http://bar/")).revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("#setRelayer()", () => {

      it("should allow owner to set Relayer", async () => {
        await bnft.connect(bnftContractOwner).setRelayer(randomSigner.address);
        expect(await bnft.relayer()).to.be.eq(randomSigner.address)
      });

      it("should not allow a random address to set Relayer", async () => {
        await expect(bnft.connect(randomSigner).setRelayer(randomSigner.address)).revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("#safemint()", () => {
      it("should not allow a random address call safemint()", async () => {
        await expect(bnft.connect(randomSigner).safeMint(freelancer.address, externalId)).revertedWith("OnlyRelayerAllowed");
      });

      it("should allow the relayer address call safemint() succcessfully", async () => {
        await bnft.connect(relayer).safeMint(freelancer.address, externalId);
        expect(await bnft.ownerOf(0)).to.equal(freelancer.address);
      });

      it("should emit the correct event", async () => {
        await expect(bnft.connect(relayer).safeMint(freelancer.address, externalId)).to.emit(bnft, "NftMinted")
      });

      it("should return the correct tokenURI", async () => {
        await bnft.connect(relayer).safeMint(freelancer.address, externalId);
        expect(await bnft.tokenURI(0)).to.be.eq(`${baseURL}0`)
      });
    });

    describe("#_beforeTokenTransfer()", () => {
      it.only("should prevent braintrust membership NFT token tranfers", async () => {
        await bnft.connect(relayer).safeMint(freelancer.address, externalId);
        await expect(bnft.connect(freelancer).transferFrom(freelancer.address, randomSigner.address, 0)).revertedWith("TransferNotAllowed()");
      });

    });

    describe("#deposit()", () => {
      it("should be able to deposit if signer owns $btrst", async () => {
        await btrst.connect(btrstContractOwner).transfer(freelancer.address, 10);
        await btrst.connect(freelancer).approve(bnft.address, 10);
        await bnft.connect(relayer).safeMint(freelancer.address, externalId);
        await bnft.connect(freelancer).deposit(10, 0, freelancer.address, externalId);
        expect(await bnft.getTotalUnlockedDeposit(freelancer.address)).to.equal(10);
      });

      it("should increment deposit if signer deposits more $btrst", async () => {
        await btrst.connect(btrstContractOwner).transfer(freelancer.address, 10);
        await btrst.connect(freelancer).approve(bnft.address, 10);
        await bnft.connect(relayer).safeMint(freelancer.address, externalId);
        await bnft.connect(freelancer).deposit(5, 0, freelancer.address, externalId);
        await bnft.connect(freelancer).deposit(5, 0, freelancer.address, externalId);
        expect(await bnft.getTotalUnlockedDeposit(freelancer.address)).to.equal(10);
      });

      it("should not be able to deposit if signer does not own $btrst ", async () => {
        await btrst.connect(freelancer).approve(bnft.address, 10);
        await bnft.connect(relayer).safeMint(freelancer.address, externalId);
        await expect(bnft.connect(freelancer).deposit(10, 0, freelancer.address, externalId)).revertedWith("BTRST::_transferTokens: transfer amount exceeds balance");
      });

      it("should fail to deposit if no membership NFT exists in sender's wallet", async () => {
        await btrst.connect(btrstContractOwner).transfer(freelancer.address, 10);
        await btrst.connect(freelancer).approve(bnft.address, 10);
        await bnft.connect(relayer).safeMint(randomSigner.address, externalId);
        await expect(bnft.connect(freelancer).deposit(10, 0, freelancer.address, externalId)).revertedWith(`NoMembershipNftInWallet("${freelancer.address}")`);
      });

      it("should fail to deposit if attempting to pass an NFT that does not belong to sender's wallet", async () => {
        await btrst.connect(btrstContractOwner).transfer(relayer.address, 10);
        await btrst.connect(relayer).approve(bnft.address, 10);
        await bnft.connect(relayer).safeMint(randomSigner.address, externalId);
        await expect(bnft.connect(relayer).deposit(10, 0, freelancer.address, externalId)).revertedWith(`NoMembershipNftInWallet("${freelancer.address}")`);
      });

      it("should emit the correct event when deposit is successful", async () => {
        await btrst.connect(btrstContractOwner).transfer(freelancer.address, 10);
        await btrst.connect(freelancer).approve(bnft.address, 10);
        await bnft.connect(relayer).safeMint(freelancer.address, externalId);
        await expect(bnft.connect(freelancer).deposit(10, 0, freelancer.address, externalId)).to.emit(bnft, "Deposited")
      });

    });

    async function fundApproveBtrstAndSafemint(beneficiarySigner: any, fundAmount: number, approveAmount: number, approveAddress: string) {
      // fund the relayer with enough btrst
      await btrst.connect(btrstContractOwner).transfer(relayer.address, fundAmount);

      // approve the nft contract to be able to move btrst from relayerx
      await btrst.connect(relayer).approve(approveAddress, approveAmount);
      await bnft.connect(relayer).safeMint(beneficiarySigner.address, externalId);
    }

    async function fundFreelancerApproveBtrstSafemintAndDeposit(fundAmount: number, approveAmount: number, depositAmount: number) {
      await btrst.connect(btrstContractOwner).transfer(freelancer.address, fundAmount);
      await btrst.connect(freelancer).approve(bnft.address, approveAmount);
      await bnft.connect(relayer).safeMint(freelancer.address, externalId);
      await bnft.connect(freelancer).deposit(depositAmount, 0, freelancer.address, externalId);
    }

    async function fundRelayerApproveBtrstSafemintAndLock(fundAmount: number, approveAmount: number, depositAmount: number, availableTimeInSeconds: number) {
      await btrst.connect(btrstContractOwner).transfer(relayer.address, fundAmount);
      await btrst.connect(relayer).approve(bnft.address, approveAmount);
      await bnft.connect(relayer).safeMint(freelancer.address, externalId);
      await bnft.connect(relayer).lock(depositAmount, 0, freelancer.address, availableTimeInSeconds, externalId);
    }

    describe("#lock()", () => {
      it("should allow relayer address call lock()", async () => {
        await fundApproveBtrstAndSafemint(freelancer, 10, 10, bnft.address)
        await bnft.connect(relayer).lock(10, 0, freelancer.address, 365, externalId);
        expect(await btrst.balanceOf(bnft.address)).to.eq(10);
      });

      it("should add a new entry in lockedDeposits mapping against the beneficiary", async () => {
        await fundApproveBtrstAndSafemint(freelancer, 10, 10, bnft.address)
        await bnft.connect(relayer).lock(10, 0, freelancer.address, 365, externalId);
        const [_, btrstAmount] = await bnft.getLockedDepositByIndex(freelancer.address, 0);
        expect(btrstAmount).to.eq(10);
      });

      it("should be able to lock more entries in lockedDeposits mapping against the beneficiary", async () => {
        await fundApproveBtrstAndSafemint(freelancer, 10, 10, bnft.address)
        await bnft.connect(relayer).lock(8, 0, freelancer.address, 365, externalId);
        await bnft.connect(relayer).lock(2, 0, freelancer.address, 365, externalId);
        const [_, btrstAmount] = await bnft.getLockedDepositByIndex(freelancer.address, 1);
        expect(btrstAmount).to.eq(2);
      });

      it("should not be able to lock if beneficiary does not own a Membership NFT", async () => {
        await expect(bnft.connect(relayer).lock(10, 0, freelancer.address, 365, externalId)).revertedWith(`NoMembershipNftInWallet("${freelancer.address}")`);
      });

      it("should not be able to lock if provided NFT does not belong to beneficiary", async () => {

        // mint NFT 0 to a random address
        await fundApproveBtrstAndSafemint(randomSigner, 10, 10, bnft.address)

        // mint NFT 1 to a freelancer
        await fundApproveBtrstAndSafemint(freelancer, 10, 10, bnft.address)

        await expect(bnft.connect(relayer).lock(10, 0, freelancer.address, 365, externalId)).revertedWith(`NftDoesNotBelongToBeneficiary(0, "${freelancer.address}")`);
      });

    });

    describe("#withdrawUnlockedDeposit()", () => {
      it("should not be able to withdraw more than they have in deposit", async () => {
        await fundFreelancerApproveBtrstSafemintAndDeposit(10, 10, 10);
        await expect(bnft.connect(freelancer).withdrawUnlockedDeposit(40)).to.revertedWith("InsufficientBalance()");
      });

      it("user should successfully withdraw all their balance", async () => {
        await fundFreelancerApproveBtrstSafemintAndDeposit(10, 10, 10);
        await bnft.connect(freelancer).withdrawUnlockedDeposit(10);
        expect(await bnft.getTotalUnlockedDeposit(freelancer.address)).to.equal(0)
      });

      it("user should be able to partially withdraw from balance", async () => {
        await fundFreelancerApproveBtrstSafemintAndDeposit(10, 10, 10);
        await bnft.connect(freelancer).withdrawUnlockedDeposit(8);
        expect(await bnft.getTotalUnlockedDeposit(freelancer.address)).to.equal(2)
      });

      it("should emit correct event", async () => {
        await fundFreelancerApproveBtrstSafemintAndDeposit(10, 10, 10);
        await expect(bnft.connect(freelancer).withdrawUnlockedDeposit(10)).to.emit(bnft, "UnlockedDepositWithdrawn")
      });

      it("should not be able to withdraw if user has not made any deposits", async () => {
        await expect(bnft.connect(freelancer).withdrawUnlockedDeposit(10)).to.revertedWith("InsufficientBalance()");
      });

    });

    describe("#withdrawLockedDeposit()", () => {
      it("should not be able to withdraw more their locked balance", async () => {
        await fundRelayerApproveBtrstSafemintAndLock(10, 10, 10, 0);
        await expect(bnft.connect(freelancer).withdrawLockedDeposit(40, 0)).to.revertedWith("InsufficientBalance()");
      });

      it("user should successfully withdraw all their locked balance", async () => {
        await fundRelayerApproveBtrstSafemintAndLock(10, 10, 10, 4 * DAY);
        await simulateTimeTravel(4 * DAY);
        await bnft.connect(freelancer).withdrawLockedDeposit(10, 0);
        expect(await bnft.getTotalLockedDepositAmount(freelancer.address)).to.equal(0)
      });

      it("user should not be able to withdraw if available time has not reached", async () => {
        await fundRelayerApproveBtrstSafemintAndLock(10, 10, 10, 4 * DAY);
        await expect(bnft.connect(freelancer).withdrawLockedDeposit(10, 0)).to.revertedWith("LockPeriodNotReached()");
      });

      it("user should be able to partially withdraw from balance", async () => {
        await fundRelayerApproveBtrstSafemintAndLock(10, 10, 10, 4 * DAY);
        await simulateTimeTravel(4 * DAY);
        await bnft.connect(freelancer).withdrawLockedDeposit(8, 0);
        expect(await bnft.getTotalLockedDepositAmount(freelancer.address)).to.equal(2)
      });

      it("user should be able to withdraw all their locked deposits if they exists on multiple indices", async () => {
        await fundRelayerApproveBtrstSafemintAndLock(10, 10, 10, 4 * DAY);
        await fundRelayerApproveBtrstSafemintAndLock(10, 10, 10, 5 * DAY);
        await simulateTimeTravel(5 * DAY);
        await bnft.connect(freelancer).withdrawLockedDeposit(10, 0);
        await bnft.connect(freelancer).withdrawLockedDeposit(8, 0);
        expect(await bnft.getTotalLockedDepositAmount(freelancer.address)).to.equal(2)
      });

      it("should emit correct event", async () => {
        await fundRelayerApproveBtrstSafemintAndLock(10, 10, 10, 4 * DAY);
        await simulateTimeTravel(4 * DAY);
        await expect(bnft.connect(freelancer).withdrawLockedDeposit(10, 0)).to.emit(bnft, "LockedDepositWithdrawn").withArgs(freelancer.address, 10, 0)
      });

    });

  });
});
