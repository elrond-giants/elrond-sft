import {
    Address,
    AddressValue,
    BytesValue,
    ContractFunction,
    TokenPayment,
    Transaction,
    TransactionPayload,
    TransactionWatcher,
} from '@elrondnetwork/erdjs/out';

import { chain, chainId, elrondExplorer, issueTokenScAddress, pemKeyFileName } from '../config';
import { loadConfigFromFile, publicEndpointSetup } from '../utils';

export const setRoles = async () => {
  const config = loadConfigFromFile();
  if (!config.tokenIdentifier) {
    console.log('Token identifier not found. Please run "issue-token" command first.');
    return;
  }

  const tokenIdentifier = config.tokenIdentifier;

  try {
    const { signer, provider, userAccount } = await publicEndpointSetup(pemKeyFileName);

    console.log("Sending transaction...");

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

    console.log(`Set Roles Transaction (${txStatus}) ${elrondExplorer[chain]}/transactions/${txHash}`);
  } catch (e) {
    console.log((e as Error)?.message);
  }
};
