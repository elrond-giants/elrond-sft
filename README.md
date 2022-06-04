# Elrond SFT Issue & Airdrop

This is a CLI tool you can use to execute SFT related operations on the Elrond Network.

## Getting Started

### Install package

`npm i package123`

### Generate a PEM file wallet

Make sure you have a PEM file wallet in the current directly (the one you're running the package from).
_You can use [erdpy](https://docs.elrond.com/sdk-and-tools/erdpy/erdpy/) to generate a PEM file wallet by running `erdpy wallet new --pem --output-path wallet`_

### Mint SFT

Before you mint an SFT you will need to issue a token and assign some roles to it.

1. Issue Token
   Run `package123 issue-token` and fill in the Token Name and the Token Ticker.
   _Make sure you don't include any spaces in the Token Name._
   _Make sure to only use Uppercase chars in the Token Ticker and avoid spaces._

2. Set Roles
   _In order to be able to perform actions over a token (mint, burn, etc), one needs to have roles assigned._
   In order to assign the roles, you need to run `package123 set-roles`.

3. Mint SFT
   Now that we have a token and the roles, you can finally mint the SFT by running `package123 mint-sft`.
