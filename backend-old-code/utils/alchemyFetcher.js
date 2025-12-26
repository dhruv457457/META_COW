const fetch = require("node-fetch"); // Ensure installed: npm i node-fetch
require("dotenv").config();

const ALCHEMY_API_URL = process.env.ALCHEMY_API_URL; // ✅ put your full Alchemy testnet endpoint in .env

// 🔁 Get all token transfers *to* an address (general use)
async function getTransfersForAddress(toAddress) {
  const res = await fetch(ALCHEMY_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          toAddress: toAddress,
          excludeZeroValue: true,
          category: ["erc20", "external"],
          withMetadata: true,
          maxCount: "0x3e8"
        }
      ]
    })
  });

  try {
    const { result } = await res.json();
    return result.transfers || [];
  } catch (err) {
    console.error("❌ Alchemy fetch failed:", err);
    return [];
  }
}

// 🔁 Filter only swaps (tokens A and B involved)
async function getSwapLikeTransfers(tokenA, tokenB, pairAddress) {
  const res = await fetch(ALCHEMY_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          toAddress: pairAddress,
          excludeZeroValue: true,
          category: ["erc20"],
          withMetadata: true,
          maxCount: "0x3e8", // 1000
        },
      ],
    }),
  });

  try {
    const { result } = await res.json();
    if (!result?.transfers) return [];

    const tokenAAddr = tokenA.toLowerCase();
    const tokenBAddr = tokenB.toLowerCase();

    const transfers = result.transfers
      .filter((tx) => {
        const addr = tx.rawContract?.address?.toLowerCase();
        return addr === tokenAAddr || addr === tokenBAddr;
      })
      .map((tx) => {
        const valueRaw = tx.rawContract?.value || "0x0";
        const timestamp = new Date(tx.metadata.blockTimestamp).getTime() / 1000;

        return {
          token: tx.rawContract?.address,
          price: parseFloat(BigInt(valueRaw).toString()) / 1e18,
          volume: parseFloat(BigInt(valueRaw).toString()) / 1e18,
          timestamp: Math.floor(timestamp),
        };
      });

    return transfers;
  } catch (err) {
    console.error("⚠️ Alchemy error:", err.message);
    return [];
  }
}


module.exports = {
  getTransfersForAddress,
  getSwapLikeTransfers
};
