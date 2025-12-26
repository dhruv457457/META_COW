const ALCHEMY_API_URL = "https://bnb-testnet.g.alchemy.com/v2/prb3bBkj1v9clt6hCTvVqcOBOCCHgLc6";

export async function getTransfersForAddress(toAddress) {
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
    console.error("Alchemy fetch failed:", err);
    return [];
  }
}
export async function getSwapLikeTransfers(tokenA, tokenB, address) {
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
          toAddress: address,
          excludeZeroValue: true,
          category: ["erc20"],
          withMetadata: true
        }
      ]
    })
  });

  try {
    const { result } = await res.json();
    if (!result || !result.transfers) return [];

    const tokenAAddr = tokenA?.address?.toLowerCase() ?? "";
    const tokenBAddr = tokenB?.address?.toLowerCase() ?? "";

    const filtered = result.transfers.filter(tx => {
      const addr = tx.rawContract?.address?.toLowerCase();
      return addr === tokenAAddr || addr === tokenBAddr;
    });

    return filtered.map(tx => ({
      price: parseFloat(tx.value || "0"), // rough estimate
      volume: parseFloat(tx.value || "0"),
      timestamp: Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000)
    }));
  } catch (err) {
    console.error("Alchemy chart fetch failed:", err);
    return [];
  }
}
