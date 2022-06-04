export const hexToString = (hex: string) => {
  console.log(Buffer.from(hex, "hex").toString("utf-8"));
};
