import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { AuthProvider } from "./contexts/AuthContext"; // ✅ import this
import { WalletProvider } from "./contexts/WalletContext"; // ✅ already imported

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WalletProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </WalletProvider>
  </React.StrictMode>
);
