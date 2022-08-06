<p align="center">
  <a href="https://www.usebraintrust.com/">
    <img src="https://avatars.githubusercontent.com/u/43866605?s=200&v=4" alt="Braintrust" title="Braintrust Official" style="border:none;"/>
  </a>
</p>

**Braintrust Monorepo - Repository for Braintrust contracts.**

This repository contains the source code for Braintrust contracts.

## Summary

This is the git repository for the BTRST contracts. It contains a openzeppelin-based contracts and hardhat deployment and configuration for testing and deployment to various networks.

## Requirements

Node, NPM, Hardhat

**NOTE:** If you are not familiar with Hardhat or with interacting with Ethereum as a developer, we suggest doing this tutorial first: https://hardhat.org/tutorial/

## Installation

### Setup
Clone the repo, then:

```bash
yarn install
```

### Unit tests

```bash
yarn test-coverage
```

### Deploy
`yarn deploy --network <NETWORK NAME>` e.g

```bash
yarn deploy --network goerli
```
You may want to verify deployment after that with 

```
yarn verify --network goerli
```
