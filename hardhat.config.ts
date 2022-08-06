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
const infuraProjectID = process.env.INFURA_PROJECT_ID;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

module.exports = {
  paths: {
    tests: "tests",
  },
  typechain: {
    target: "ethers-v5",
  },
  // defaultNetwork: "goerli",
  etherscan: {
    apiKey: etherscanApiKey
  },
  networks: {
    hardhat: {},
    local: {
      url: "http://localhost:8545",
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${infuraProjectID}`,
      accounts: [`0x${deployerPK}`],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      goerli: 0,
    },
    multisig: {
      default: 0,
      goerli: 0, // for now leave this same as deployer address, but on mainnet, we should change it to the provided multisig address
    },
    relayer: {
      default: 0,
      goerli: 0, // for now leave this same as deployer address, but on mainnet, we should change it to the provided relayer address
    },
    btrstERC20: {
      default: "0x2d5eb40e24615cA3415d3cC6961Bc2e9Ca2582D7",
      goerli: "0x2d5eb40e24615cA3415d3cC6961Bc2e9Ca2582D7" // on mainnet this should point to main btrst contract
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
