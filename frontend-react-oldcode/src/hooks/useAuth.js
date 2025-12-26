import { useWallet } from "../contexts/WalletContext";
import { useState } from "react";
import { showError, showSuccess } from "../utils/toast";

export function useAuth() {
  const { walletData } = useWallet();
  const [token, setToken] = useState(localStorage.getItem("jwtToken") || null);

  const signInWithWallet = async () => {
    try {
      if (!walletData?.address) {
        showError("Wallet not connected");
        return;
      }

      // 1. Fetch nonce
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletData.address }),
      });
      const { nonce } = await nonceRes.json();

      // 2. Sign the nonce
      const signature = await walletData.signer.signMessage(nonce);

      // 3. Send to backend for verification
      const verifyRes = await fetch("https://meta-cow.onrender.com/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletData.address, signature }),
      });
      const data = await verifyRes.json();

      if (!verifyRes.ok) throw new Error(data.error || "Signature verification failed");

      // 4. Save JWT to localStorage
      localStorage.setItem("jwtToken", data.token);
      setToken(data.token);
      showSuccess("Signed in with wallet!");

      return { success: true, token: data.token };
    } catch (err) {
      showError("Sign-in failed: " + err.message);
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    setToken(null);
    showSuccess("Logged out");
  };

  return { token, signInWithWallet, logout };
}
