import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";
import "hardhat-deploy";
import '@openzeppelin/hardhat-upgrades';
import "@nomiclabs/hardhat-etherscan";
import 'solidity-coverage'; //https://app.codecov.io/gh/Edwin-BT/BTRST-Contracts/new
import { config } from "dotenv";
config({ path: ".env" });

const deployerPK = process.env.DEPLOYER_PK;
const nodeKey = process.env.NODE_KEY;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

module.exports = {
  paths: {
    tests: "tests",
  },
  typechain: {
    target: "ethers-v5",
  },
   defaultNetwork: "mainnet",
  etherscan: {
    apiKey: etherscanApiKey
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${nodeKey}`,
      accounts: [`0x${deployerPK}`],
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${nodeKey}`,
      accounts: [`0x${deployerPK}`],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      goerli: 0,
      mainnet: 0
    },
    multisig: {
      default: 0,
      goerli: 0, 
      mainnet: "0xE3857a42803D3f9de273a42c01DA5F05066F7CFc"
    },
    relayer: {
      default: 0,
      goerli: 0, // for now leave this same as deployer address, but on mainnet, we should change it to the provided relayer address
      mainnet: "0xfc1f528e7da84732663b70ca52bdc0215b222d44"
    },
    btrstERC20: {
      default: "0x2d5eb40e24615cA3415d3cC6961Bc2e9Ca2582D7",
      goerli: "0x6C104B5A847dA440B0009C5C2D44006823d48214",
      mainnet: "0x799ebfABE77a6E34311eeEe9825190B9ECe32824"
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          evmVersion: "istanbul",
          metadata: { useLiteralContent: true },
        },
      },
      {
        version: "0.8.11",
        settings: {
          evmVersion: "istanbul",
          metadata: { useLiteralContent: true },
        },
      },
    ],
  },
}
