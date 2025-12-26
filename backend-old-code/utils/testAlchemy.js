// utils/testAlchemy.js
const { getSwapLikeTransfers } = require("./alchemyFetcher");

(async () => {
  const tokenA = "0x8b0C1326D16eC18B7af6F75A352Cb0fFe8862e44"; // TKA
  const tokenB = "0xae9e16b1fa7FA2962Ade8758c171E619f780f516"; // TKB
  const pair = "0x9d983a9a9b834ada7b587b420750bd72afb6f0b5";

  const swaps = await getSwapLikeTransfers(tokenA, tokenB, pair);
  console.log("📊 Parsed Transfers for Chart:\n", swaps);
})();
