
import { DeployFunction } from "hardhat-deploy/types";
const func: DeployFunction = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    network,
}) => {
    const { deploy } = deployments;
    const namedAccounts = await getNamedAccounts();

    const deployer = namedAccounts.deployer;
    const relayer = namedAccounts.relayer;
    const multisig = namedAccounts.multisig;
    const baseURL = "https://app9.bthexocean.com/nft/metadata/";

    console.log("----------------------------------------------------");
    console.log(`Deploying BTRST with: { deployer: ${deployer}, foundationInitialAddress: ${deployer} }}`);
    const btrst = await deploy('BTRST', {
        from: deployer,
        args: [deployer],
    });
    console.log("BTRST deployed to: ", btrst.address);

    console.log("----------------------------------------------------");
    console.log(`Deploying BNFT with: { deployer: ${deployer}, relayer: ${relayer} }}`);

    const bnft = await deploy("BraintrustMembershipNFT", {
        contract: 'BraintrustMembershipNFT',
        from: deployer,
        log: true,
        proxy: {
            owner: multisig,
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                init: {
                    methodName: 'initialize', // todo - not sure why this function is not being called by hardhat deploy after contract successfully deploys
                    args: [relayer, btrst.address, baseURL],
                },
            },
        },
    });

    console.log("BraintrustMembershipNFT deployed to: ", bnft.address);

};

func.id = "deploy_bnft";
func.tags = ["BTRST", "dev"];
func.dependencies = [];
export default func;
