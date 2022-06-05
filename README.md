# Elrond SFT Issue & Airdrop

This is a CLI tool you can use to execute SFT related operations on the Elrond Network.

## What can you do

- issue token `elrond-sft issue-token`
- set roles `elrond-sft set-roles`
- mint SFT `elrond-sft mint-sft`

## Getting Started

### Install package

`npm i elrond-sft`

### Generate a PEM file wallet

Make sure you have a PEM file wallet in the current directly (the one you're running the package from).
_You can use [erdpy](https://docs.elrond.com/sdk-and-tools/erdpy/erdpy/) to generate a PEM file wallet by running `erdpy wallet new --pem --output-path wallet`_

### Mint SFT

Before you mint an SFT you will need to issue a token and assign some roles to it.

1. Issue Token
   Run `elrond-sft issue-token` and fill in the Token Name and the Token Ticker.
   _Make sure you don't include any spaces in the Token Name._
   _Make sure to only use Uppercase chars in the Token Ticker and avoid spaces._

2. Set Roles
   _In order to be able to perform actions over a token (mint, burn, etc), one needs to have roles assigned._
   In order to assign the roles, you need to run `elrond-sft set-roles`.

3. Mint SFT
   Now that we have a token and the roles, you can finally mint the SFT by running `elrond-sft mint-sft`.

## TODO

- add quantity command
- burn command
- airdrop SFT to a list of addresses
- refactor erdjs interactions

## Resources

- Some wallet interaction methods are taken from [elven-tools-cli](https://github.com/ElvenTools/elven-tools-cli)
- [erdjs](https://www.npmjs.com/package/@elrondnetwork/erdjs) is used to interact with the Elrond Blockchain
