import Factory from "../abis/Factory.json";
import Pair from "../abis/Pair.json";

// 🏭 DEX Constants
export const FACTORY_ADDRESS = "0x2A07A0013877e3bcCDd42Da8171457B0B54EB54d";
export const FACTORY_ABI = Factory.abi;
export const PAIR_ABI = Pair.abi;

// 🪙 Token List with decimals and optional logos
export const tokenList = [
  {
    symbol: "TKA",
    address: "0xF563d7a976313D363fFB0dF60DC82DF02CeD85cb",
    decimals: 18,
    logoURI: "/logos/tka.png",
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
    symbol: "MOC", // ✅ must match the symbol inside token contract
    address: "0x7a7164eb300C9d897668BA878645Bd2f0f96A5b7",
    decimals: 18,
    logoURI: "/logos/moc.png",
  },
];


// export const tokenList = [
//   {
//     symbol: "TKA",
//     address: "0xD7c6cDFE1EB47fb74F2682F672B84c70A1891c93",
//     decimals: 18,
//     logoURI: "/logos/tka.png",
//   },
//   {
//     symbol: "TKB",
//     address: "0x23CB54C5083DCeF3877a32409727cCb9afC4d333",
//     decimals: 18,
//     logoURI: "/logos/tkb.png",
//   },
//   {
//     symbol: "USD",
//     address: "0x35f7F94224ed0fE995f391CeC8FA7dEe64107Bf1",
//     decimals: 18,
//     logoURI: "/logos/usdt.png",
//   },
//   {
//     symbol: "MOC", // ✅ must match the symbol inside token contract
//     address: "0x26F9Ec14564B73DC95a79898bce62656a9A5503D",
//     decimals: 18,
//     logoURI: "/logos/moc.png",
//   },
// ];

