import {
    BytesValue,
    ContractFunction,
    TokenPayment,
    Transaction,
    TransactionPayload,
    TransactionWatcher,
    U32Value,
} from '@elrondnetwork/erdjs/out';
import prompts, { PromptObject } from 'prompts';

import { chain, chainId, elrondExplorer, pemKeyFileName } from '../config';
import { IConfig, loadConfigFromFile, publicEndpointSetup } from '../utils';

export const mintSft = async (_tokenIdentifier?: IConfig["tokenIdentifier"]) => {
  const config = loadConfigFromFile();

  const tokenIdentifier = _tokenIdentifier || config?.tokenIdentifier;

  if (!tokenIdentifier) {
    console.log(
      'Token identifier not found. Please run "issue-token" command first or input it manually (check docs for details).'
    );
    return;
  }

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

    console.log("Sending transaction...");

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
      value: TokenPayment.egldFromAmount(0),
      gasLimit: 60000000,
      chainID: chainId[chain],
    });

    transaction.setNonce(userAccount.nonce);
    userAccount.incrementNonce();

    await signer.sign(transaction);

    await provider.sendTransaction(transaction);

    const watcher = new TransactionWatcher(provider);
    const transactionOnNetwork = await watcher.awaitCompleted(transaction);

    const txHash = transactionOnNetwork.hash;
    const txStatus = transactionOnNetwork.status;

    console.log(`SFT Mint Transaction (${txStatus})  ${elrondExplorer[chain]}/transactions/${txHash}`);
  } catch (e) {
    console.log((e as Error)?.message);
  }
};
