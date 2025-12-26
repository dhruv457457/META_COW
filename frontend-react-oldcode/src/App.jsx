import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { WalletProvider } from "./contexts/WalletContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Swap from "./pages/Swap";
import CreatePair from "./pages/CreatePair";
import Liquidity from "./pages/Liquidity";
import ProfilePage from "./pages/ProfilePage"; // Import ProfilePage if needed
import FaucetAdminPanel from "./pages/FaucetAdminPanel";
import FaucetClaim from "./pages/FaucetClaim"; // Import FaucetClaim if needed
import SocialPage from "./pages/SocialPage";
export default function App() {
  return (
    <WalletProvider>
      <Router>
        <Navbar />
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-white text-gray-800">
          <main className="min-h-[calc(100vh-4rem)]">
            <div className="">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/liquidity" element={<Liquidity />} />
                <Route path="/create-pair" element={<CreatePair />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<FaucetAdminPanel />} />
                <Route path="/faucet" element={<FaucetClaim />} />
                <Route path="/social" element={<SocialPage />} />
              </Routes>
            </div>
          </main>
        </div>
        <Toaster />
      </Router>
    </WalletProvider>
  );
}

