
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
    const btrstERC20 = namedAccounts.btrstERC20;
    const baseURL = "https://app9.bthexocean.com/nft/metadata/";
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
                    args: [relayer, btrstERC20, baseURL],
                },
            },
        },
    });

    console.log("BraintrustMembershipNFT deployed to: ", bnft.address);

};

func.id = "deploy_bnft";
func.tags = ["BNFT", "main"];
func.dependencies = [];
export default func;
