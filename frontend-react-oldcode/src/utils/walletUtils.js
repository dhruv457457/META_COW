export async function addTokenToWallet(token) {
  if (!window.ethereum) return;

  try {
    const wasAdded = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals || 18,
          image: token.logoURI || "", // Optional
        },
      },
    });

    if (wasAdded) {
      console.log(`${token.symbol} added to wallet`);
    } else {
      console.log("Token addition rejected");
    }
  } catch (error) {
    console.error("Failed to add token:", error);
  }
}
