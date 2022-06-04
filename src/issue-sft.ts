import {
    Address,
    AddressValue,
    Balance,
    BytesValue,
    ChainID,
    ContractFunction,
    GasLimit,
    Transaction,
    TransactionPayload,
    U32Value,
} from '@elrondnetwork/erdjs/out';
import axios from 'axios';
import prompts, { PromptObject } from 'prompts';

import { chain, chainId, elrondExplorer, issueTokenScAddress, pemKeyFileName, proxyGateways } from './config';
import { loadConfigFromFile, publicEndpointSetup, saveConfigToFile } from './utils';

export const issueToken = async () => {
  const promptQuestions: PromptObject[] = [
    {
      type: "text",
      name: "tokenName",
      message: "Token name",
      validate: (value) => {
        if (!value) return "Required!";
        if (value.length > 20 || value.length < 3) {
          return "Length between 3 and 20 characters!";
        }
        if (!new RegExp(/^[a-zA-Z0-9]+$/).test(value)) {
          return "Alphanumeric characters only!";
        }
        return true;
      },
    },
    {
      type: "text",
      name: "tokenTicker",
      message: "Token ticker",
      validate: (value) => {
        if (!value) return "Required!";
        if (value.length > 10 || value.length < 3) {
          return "Length between 3 and 10 characters!";
        }
        if (!new RegExp(/^[A-Z0-9]+$/).test(value)) {
          return "Alphanumeric UPPERCASE only!";
        }
        return true;
      },
    },
  ];

  try {
    const { tokenName, tokenTicker } = await prompts(promptQuestions);

    let payload = TransactionPayload.contractCall()
      .setFunction(new ContractFunction("issueSemiFungible"))
      .addArg(new BytesValue(Buffer.from(tokenName, "utf-8")))
      .addArg(new BytesValue(Buffer.from(tokenTicker, "utf-8")));

    let transaction = new Transaction({
      data: payload.build(),
      receiver: new Address(issueTokenScAddress),
      value: Balance.egld(0.05),
      gasLimit: new GasLimit(60000000),
      chainID: new ChainID(chainId[chain]),
    });

    const { signer, provider, userAccount } = await publicEndpointSetup(pemKeyFileName);

    console.log("Sending transaction...");

    transaction.setNonce(userAccount.nonce);
    userAccount.incrementNonce();

    await signer.sign(transaction);

    await transaction.send(provider);

    await transaction.awaitNotarized(provider);
    const txHash = transaction.getHash();

    console.log(`Issue token transaction  ${elrondExplorer[chain]}/transactions/${txHash}`);

    // Get the token identifier from the transaction response & save it to a JSON file to use in other methods
    const { data } = await axios.get(`${proxyGateways[chain]}/transactions/${txHash}`);
    const tokenIdentifierBase64 = data?.logs?.events?.[0]?.topics?.[0];
    if (tokenIdentifierBase64) {
      const tokenIdentifier = Buffer.from(tokenIdentifierBase64, "base64").toString("utf-8");
      saveConfigToFile({
        tokenIdentifier,
      });
      console.log(`Token identifier ${tokenIdentifier}`);
    }
  } catch (e) {
    console.log(e);
  }
};

export const setRoles = async () => {
  const config = loadConfigFromFile();
  if (!config.tokenIdentifier) {
    console.log('Token identifier not found. Please run "issue-token" command first.');
    return;
  }

  const tokenIdentifier = config.tokenIdentifier;

  try {
    const { signer, provider, userAccount } = await publicEndpointSetup(pemKeyFileName);

    let payload = TransactionPayload.contractCall()
      .setFunction(new ContractFunction("setSpecialRole"))
      .addArg(new BytesValue(Buffer.from(tokenIdentifier, "utf-8")))
      .addArg(new AddressValue(userAccount.address))
      .addArg(new BytesValue(Buffer.from("ESDTRoleNFTCreate", "utf-8")))
      .addArg(new BytesValue(Buffer.from("ESDTRoleNFTBurn", "utf-8")))
      .addArg(new BytesValue(Buffer.from("ESDTRoleNFTAddQuantity", "utf-8")));

    let transaction = new Transaction({
      data: payload.build(),
      receiver: new Address(issueTokenScAddress),
      value: Balance.Zero(),
      gasLimit: new GasLimit(60000000),
      chainID: new ChainID(chainId[chain]),
    });

    transaction.setNonce(userAccount.nonce);
    userAccount.incrementNonce();

    await signer.sign(transaction);

    await transaction.send(provider);

    await transaction.awaitHashed();
    const txHash = transaction.getHash();

    console.log(`Set Roles Transaction  ${elrondExplorer[chain]}/transactions/${txHash}`);
  } catch (e) {
    console.log(e);
  }
};

export const mintSft = async () => {
  const config = loadConfigFromFile();
  if (!config.tokenIdentifier) {
    console.log('Token identifier not found. Please run "issue-token" command first.');
    return;
  }

  const tokenIdentifier = config.tokenIdentifier;

  const promptQuestions: PromptObject[] = [
    {
      type: "number",
      name: "qunatity",
      message: "SFT Quantity",
      min: 1,
      validate: (value) => {
        if (!value) return "Required!";
        if (value < 1) {
          return "Quantity must be at least 1";
        }
        return true;
      },
    },
    {
      type: "text",
      name: "sftName",
      message: "SFT Name",
      validate: (value) => {
        if (!value) return "Required!";
        if (value.length > 20 || value.length < 1) {
          return "Length between 1 and 20 characters!";
        }
        if (!new RegExp(/^[a-zA-Z0-9 ]+$/).test(value)) {
          return "Alphanumeric characters & spaces only!";
        }
        return true;
      },
    },
    {
      type: "number",
      name: "royalties",
      message: "SFT Royalties",
      min: 0,
      max: 100,
      validate: (value) => {
        if (!value) return "Required!";
        if (value < 0 || value > 100) {
          return "Royalties must be between 0 and 100";
        }
        return true;
      },
    },
    {
      type: "text",
      name: "metadataCid",
      message: "Metadata CID",
      validate: (value) => {
        if (!value) return "Required!";
        if (value.length !== 59) {
          return "The length of a CID is 59 characters";
        }
        if (!new RegExp(/^[a-z0-9,]+$/).test(value)) {
          return "Invalid CID!";
        }
        return true;
      },
    },
    {
      type: "text",
      name: "tags",
      message: "SFT Tags (comma separated)",
      validate: (value) => {
        if (!value) return "Required!";
        if (!new RegExp(/^[a-z0-9,]+$/).test(value)) {
          return "Alphanumeric characters & commas only!";
        }
        return true;
      },
    },
    {
      type: "text",
      name: "imageCid",
      message: "Image CID",
      validate: (value) => {
        if (!value) return "Required!";
        if (value.length !== 59) {
          return "The length of a CID is 59 characters";
        }
        if (!new RegExp(/^[a-z0-9]+$/).test(value)) {
          return "Invalid CID!";
        }
        return true;
      },
    },
  ];

  try {
    const { qunatity, sftName, royalties, metadataCid, tags, imageCid } = await prompts(promptQuestions);

    const { signer, provider, userAccount } = await publicEndpointSetup(pemKeyFileName);

    let payload = TransactionPayload.contractCall()
      .setFunction(new ContractFunction("ESDTNFTCreate"))
      .addArg(new BytesValue(Buffer.from(tokenIdentifier, "utf-8")))
      .addArg(new U32Value(qunatity))
      .addArg(new BytesValue(Buffer.from(sftName, "utf-8")))
      .addArg(new U32Value(royalties * 100))
      .addArg(new U32Value(0))
      .addArg(new BytesValue(Buffer.from(`metadata:${metadataCid};tags:${tags}`, "utf-8")))
      .addArg(new BytesValue(Buffer.from(`https://ipfs.io/ipfs/${imageCid}`, "utf-8")))
      .addArg(new BytesValue(Buffer.from(`https://ipfs.io/ipfs/${metadataCid}`, "utf-8")));

    let transaction = new Transaction({
      data: payload.build(),
      receiver: userAccount.address,
      value: Balance.Zero(),
      gasLimit: new GasLimit(60000000),
      chainID: new ChainID(chainId[chain]),
    });

    transaction.setNonce(userAccount.nonce);
    userAccount.incrementNonce();

    await signer.sign(transaction);

    await transaction.send(provider);

    await transaction.awaitHashed();
    const txHash = transaction.getHash();

    console.log(`SFT Mint Transaction  ${elrondExplorer[chain]}/transactions/${txHash}`);
  } catch (e) {
    console.log(e);
  }
};
