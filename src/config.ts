export const chain = process.env.CHAIN || "devnet";

export const pemKeyFileName = "wallet.pem";

export const proxyGateways: { [key: string]: string } = {
  testnet: "https://testnet-api.elrond.com",
  devnet: "https://devnet-api.elrond.com",
  mainnet: "https://api.elrond.com",
};

export const elrondExplorer: { [key: string]: string } = {
  devnet: "https://devnet-explorer.elrond.com",
  testnet: "https://testnet-explorer.elrond.com",
  mainnet: "https://explorer.elrond.com",
};

export const chainId: { [key: string]: string } = {
  devnet: "D",
  testnet: "T",
  mainnet: "1",
};

export const issueTokenScAddress = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u";
