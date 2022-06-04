import { Account, IProvider, NetworkConfig, parseUserKey, ProxyProvider, UserSigner } from '@elrondnetwork/erdjs';
import { accessSync, readFileSync } from 'fs';
import { cwd, exit } from 'process';

import { chain, pemKeyFileName, proxyGateways } from './config';

export const baseDir = cwd();

export const prepareUserAccount = async (walletPemKey: string) => {
  const userKey = parseUserKey(walletPemKey);
  const address = userKey.generatePublicKey().toAddress();
  return new Account(address);
};

export const getFileContents = (relativeFilePath: string, options: { isJSON?: boolean; noExitOnError?: boolean }) => {
  const isJSON = options.isJSON === undefined ? true : options.isJSON;
  const noExitOnError = options.noExitOnError === undefined ? false : options.noExitOnError;

  const filePath = `${baseDir}/${relativeFilePath}`;

  try {
    accessSync(filePath);
  } catch (err) {
    if (!noExitOnError) {
      console.error(`There is no ${relativeFilePath}!`);
      exit(9);
    } else {
      return undefined;
    }
  }

  const rawFile = readFileSync(filePath);
  const fileString = rawFile.toString("utf8");

  if (isJSON) {
    return JSON.parse(fileString);
  }
  return fileString;
};

export const getProvider = () => {
  return new ProxyProvider(proxyGateways[chain], { timeout: 10000 });
};

export const syncProviderConfig = async (provider: IProvider) => {
  return NetworkConfig.getDefault().sync(provider);
};

export const prepareUserSigner = (walletPemKey: string) => {
  return UserSigner.fromPem(walletPemKey);
};

export const publicEndpointSetup = async (_pemKeyFileName?: string) => {
  const walletPemKey = getFileContents(_pemKeyFileName || pemKeyFileName, { isJSON: false });
  // Provider type based on initial configuration
  const provider = getProvider();
  await syncProviderConfig(provider);

  const userAccount = await prepareUserAccount(walletPemKey);
  await userAccount.sync(provider);

  const signer = prepareUserSigner(walletPemKey);

  return {
    signer,
    userAccount,
    provider,
  };
};
