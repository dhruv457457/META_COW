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
    address: "0x2AaF51745dbf59938fD364F08f06E6d8B34f4b49",
    decimals: 18,
    logoURI: "/logos/tkb.png",
  },
  {
    symbol: "USD",
    address: "0x021D0f2212ec1869933F4D21ea76dCF9e127396B",
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