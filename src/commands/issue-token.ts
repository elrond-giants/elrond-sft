import {
    Address,
    BytesValue,
    ContractFunction,
    TokenPayment,
    Transaction,
    TransactionPayload,
    TransactionWatcher,
} from '@elrondnetwork/erdjs/out';
import prompts, { PromptObject } from 'prompts';

import { chain, chainId, elrondExplorer, issueTokenScAddress, pemKeyFileName } from '../config';
import { publicEndpointSetup, saveConfigToFile } from '../utils';

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
      value: TokenPayment.egldFromAmount(0.05),
      gasLimit: 60000000,
      chainID: chainId[chain],
    });

    const { signer, provider, userAccount } = await publicEndpointSetup(pemKeyFileName);

    console.log("Sending transaction...");

    transaction.setNonce(userAccount.nonce);
    userAccount.incrementNonce();

    await signer.sign(transaction);

    await provider.sendTransaction(transaction);

    const watcher = new TransactionWatcher(provider);
    const transactionOnNetwork = await watcher.awaitCompleted(transaction);

    const txHash = transactionOnNetwork.hash;
    const txStatus = transactionOnNetwork.status;

    console.log(`Issue token transaction (${txStatus}) ${elrondExplorer[chain]}/transactions/${txHash}`);

    if (transactionOnNetwork.status.isExecuted()) {
      const payload = transactionOnNetwork.contractResults?.items?.[0]?.data;
      const payloadParts = payload?.split("@");
      const tokenIdentifier = Buffer.from(payloadParts[payloadParts.length - 1], "hex").toString("utf-8");
      saveConfigToFile({
        tokenIdentifier,
      });
      console.log(`Token identifier ${tokenIdentifier}`);
    }
  } catch (e) {
    console.log((e as Error)?.message);
  }
};
