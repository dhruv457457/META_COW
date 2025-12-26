import MetaMaskSDK from "@metamask/sdk";

const MMSDK = new MetaMaskSDK({
  injectProvider: true,
  dappMetadata: {
    name: "MetaCow",
    url: window.location.href,
  },
});

const ethereum = MMSDK.getProvider();

export const connectWallet = async () => {
  try {
    setIsConnecting(true);

    // ✅ SDK-powered connection
    const accounts = await MMSDK.connect();

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts returned");
    }

    const ethersProvider = new ethers.BrowserProvider(ethereum);
    const ethersSigner = await ethersProvider.getSigner();
    const network = await ethersProvider.getNetwork();

    setProvider(ethersProvider);
    setSigner(ethersSigner);
    setAddress(accounts[0]);
    setChainId(network.chainId.toString());

    return { success: true };
  } catch (error) {
    console.error("SDK Wallet connect failed:", error);
    return { success: false, error: error.message || "Connection failed" };
  } finally {
    setIsConnecting(false);
  }
};
