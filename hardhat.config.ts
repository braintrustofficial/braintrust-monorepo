import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";
import "hardhat-deploy";


module.exports = {
  paths: {
    tests: "tests",
  },
  typechain: {
    target: "ethers-v5",
  },
  networks: {
    local: {
      url: "http://localhost:8545",
    },
  },
  namedAccounts: {
  },
  solidity: {
    compilers: [
      {
        version: "0.5.13",
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
