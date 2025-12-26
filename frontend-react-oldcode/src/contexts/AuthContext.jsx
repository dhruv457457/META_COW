import { createContext, useContext, useState, useEffect } from "react";
import { useWallet } from "./WalletContext";
import { showError, showSuccess } from "../utils/toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { walletData } = useWallet();
  const [token, setToken] = useState(localStorage.getItem("jwtToken") || null);
  const [profile, setProfile] = useState(null);

  const signInWithWallet = async () => {
    try {
      if (!walletData?.address) {
        showError("Wallet not connected");
        return;
      }

      const nonceRes = await fetch("https://meta-cow.onrender.com/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletData.address }),
      });
      const { nonce } = await nonceRes.json();

      const signature = await walletData.signer.signMessage(nonce);

      const verifyRes = await fetch("https://meta-cow.onrender.com/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletData.address, signature }),
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error || "Verification failed");

      localStorage.setItem("jwtToken", data.token);
      setToken(data.token);
      showSuccess("✅ Signed in successfully!");

      await fetchUserProfile(data.token);
    } catch (err) {
      showError("Login failed: " + err.message);
    }
  };

  const fetchUserProfile = async (jwt = token) => {
    try {
      const res = await fetch("https://meta-cow.onrender.com/api/auth/me", {
        headers: { Authorization: "Bearer " + jwt },
      });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    setToken(null);
    setProfile(null);
    showSuccess("Logged out");
  };

  useEffect(() => {
    if (token) fetchUserProfile();
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, profile, signInWithWallet, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
