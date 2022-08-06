
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
    const baseURL = "https://gateway.pinata.cloud/ipfs/QmRu5rKug5rUMnn7s6kP9uPy7meZcSTMZhpTGt5rk6w8Uj/";
    const btrstERC20 = namedAccounts.btrstERC20;

    console.log(namedAccounts);
    // process.exit(0);

    await deploy("BraintrustMembershipNFT", {
        contract: 'BraintrustMembershipNFT',
        from: deployer,
        log: true,
        proxy: {
            owner: multisig,
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                init: {
                    methodName: 'initialize',
                    args: [relayer, btrstERC20, baseURL],
                },
            },
        },
    });

};

func.id = "deploy_bnft";
func.tags = ["BNFT", "main"];
func.dependencies = [];
export default func;
