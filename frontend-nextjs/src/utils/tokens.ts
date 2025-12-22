export interface Token {
  symbol: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

export const tokenList: Token[] = [
  {
    symbol: "TKA",
    address: "0xf98101078479e0BAEB77005E3426edaC5a2405C2",
    decimals: 18,
    logoURI: "/logos/tka.png", // Ensure these exist in public/logos/
  },
  {
    symbol: "TKB",
    address: "0x7B37899552C606DCA472dEca69478E41acF474C0",
    decimals: 18,
    logoURI: "/logos/tkb.png",
  },
  {
    symbol: "USD",
    address: "0xa4b2b8954dB244B3a675aa3d0c78000db5B4D88b",
    decimals: 18,
    logoURI: "/logos/usdt.png",
  },
  {
    symbol: "MOC", 
    address: "0xE66b76f47090b76436d11d7F329e7ad0aD7eE9F0",
    decimals: 18,
    logoURI: "/logos/moc.png",
  },
];