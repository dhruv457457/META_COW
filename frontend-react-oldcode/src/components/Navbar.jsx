import { useState, useEffect, Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../contexts/WalletContext";
import { getLPBalance } from "../utils/contractUtils";
import { showError } from "../utils/toast";
import logo from "../assets/MetaCowLogo.png";
import { Transition } from "@headlessui/react";

// --- SVG Icons for a more professional look ---
const HomeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" /></svg>
);
const SwapIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6.99 11 3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" /></svg>
);
const LiquidityIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2c-5.33 4.55-8 8.48-8 11.91 0 3.22 2.69 5.82 6 5.82 2.24 0 4.25-1.18 5.31-2.95.14-.23.49-.23.62 0C16.75 18.64 18.76 19.73 21 19.73c3.31 0 6-2.6 6-5.82C27 10.48 23.33 6.55 18 2L12 2zm0 15.91c-1.48 0-2.75-1.04-2.95-2.43H12v-1.79h-2.95c-.2-.79-1.04-1.63-2.95-1.63s-2.75 1.04-2.95 2.43H3.1c.2-.79 1.04-1.63 2.95-1.63s2.75 1.04 2.95 2.43H12v-1.79h-2.95c-.2-.79-1.04-1.63-2.95-1.63s-2.75 1.04-2.95 2.43H3.1c.2-.79 1.04-1.63 2.95-1.63s2.75 1.04 2.95 2.43H12v-1.79h2.95c.2.79 1.04 1.63 2.95 1.63s2.75-1.04 2.95-2.43h.05c-.2.79-1.04 1.63-2.95 1.63s-2.75-1.04-2.95-2.43H12v1.79h2.95c.2.79 1.04 1.63 2.95 1.63s2.75-1.04 2.95-2.43h.05c-.2.79-1.04 1.63-2.95 1.63s-2.75-1.04-2.95-2.43H12v1.79h2.95c.2.79 1.04 1.63 2.95 1.63s2.75-1.04 2.95-2.43h.05c-.2.79-1.04 1.63-2.95 1.63s-2.75-1.04-2.95-2.43H12v1.79z" /></svg>
);
const SocialIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
);
const FaucetIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M18 8c0-3.31-2.69-6-6-6S6 4.69 6 8c0 2.21 1.2 4.16 3 5.19V19c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-5.81c1.8-1.03 3-2.98 3-5.19zm-9 0c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z" /></svg>
);
const ProfileIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
);
const WalletIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>
);


const BNB_TESTNET_CHAIN_ID = "97";
const BNB_TESTNET_PARAMS = {
  chainId: "0x61",
  chainName: "Binance Smart Chain Testnet",
  nativeCurrency: { name: "Binance Coin", symbol: "tBNB", decimals: 18 },
  rpcUrls: [
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://data-seed-prebsc-2-s1.binance.org:8545/",
    "https://bnb-testnet.g.alchemy.com/v2/prb3bBkj1v9clt6hCTvVqcOBOCCHgLc6",
  ],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

export default function Navbar() {
  const { walletData, connectWallet, disconnect, isConnecting } = useWallet();
  const address = walletData?.address;
  const isConnected = !!address;
  const balance = walletData?.balance || "0";
  const chainId = walletData?.chainId;
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [lpBalance, setLpBalance] = useState("0.0");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [rpcError, setRpcError] = useState(false);

  useEffect(() => {
    setWrongNetwork(isConnected && chainId !== BNB_TESTNET_CHAIN_ID);
  }, [isConnected, chainId]);
  
  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || wrongNetwork) return;
      try {
        setRpcError(false);
        const dummyPair = "0xe4452Fb3896115E28E8d4A5491019Ad8f0b66050";
        const balance = await getLPBalance(dummyPair, address);
        setLpBalance(parseFloat(balance).toFixed(4));
      } catch (err) {
        // Detect the "missing trie node" or "Internal JSON-RPC error"
        if (
          err?.message?.includes("missing trie node") ||
          err?.message?.includes("Internal JSON-RPC error") ||
          err?.code === -32603
        ) {
          setRpcError(true);
        }
        console.error("Failed to fetch LP", err);
      }
    };
    fetchBalance();
  }, [address, wrongNetwork]);

  const handleConnect = async () => {
    if (isConnecting) return;
    const result = await connectWallet();
    if (!result.success) showError(result.error || "Wallet connection failed.");
  };

  const handleSwitchNetwork = async () => {
    if (!window.ethereum) return showError("MetaMask not found");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BNB_TESTNET_PARAMS.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BNB_TESTNET_PARAMS],
          });
        } catch (addError) {
          showError("Failed to add BNB Testnet");
        }
      } else {
        showError("Failed to switch network");
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/swap", label: "Swap", icon: SwapIcon },
    { path: "/liquidity", label: "Liquidity", icon: LiquidityIcon },
    { path: "/social", label: "Social", icon: SocialIcon },
    { path: "/faucet", label: "Faucet", icon: FaucetIcon },
    { path: "/profile", label: "Profile", icon: ProfileIcon },
  ];

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-base ${
        location.pathname === item.path
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
          : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
      }`}
    >
      <item.icon className="w-5 h-5" />
      {item.label}
    </Link>
  );

  return (
    <>
      {isConnected && wrongNetwork && (
        <div className="w-full bg-red-500 text-white flex items-center justify-center gap-4 py-3 px-4 text-sm font-bold z-50 shadow-lg">
          <span>⚠️ Wrong Network</span>
          <button
            onClick={handleSwitchNetwork}
            className="bg-white text-red-600 px-3 py-1 rounded-md hover:bg-red-100 transition text-xs font-bold"
          >
            Switch to BNB Testnet
          </button>
        </div>
      )}
      {rpcError && (
        <div className="w-full bg-yellow-100 text-yellow-800 text-center py-2 px-4 font-semibold rounded mb-2">
          ⚠️ Network is busy or your RPC is having issues.<br />
          Please try reconnecting your wallet or switch to a different RPC endpoint in MetaMask.
        </div>
      )}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* LEFT: Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-2 group">
                <img src={logo} alt="MetaCow" className="w-12 h-12 transition-transform group-hover:rotate-12"/>
                <span className="text-2xl font-bold text-gray-800 tracking-tight hidden sm:block">
                  MetaCow
                </span>
              </Link>
            </div>

            {/* CENTER: Nav (Desktop) */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </div>

            {/* RIGHT: Wallet */}
            <div className="flex items-center gap-4">
              {isConnected ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 bg-white border-2 border-gray-200 pl-2 pr-3 py-2 rounded-full hover:border-purple-400 transition-all duration-300 shadow-sm"
                  >
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                        <WalletIcon className="w-5 h-5"/>
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-bold text-gray-800">
                        {balance} tBNB
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <Transition
                    show={showDropdown}
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-150"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-50 origin-top-right">
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                            <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} alt="wallet avatar" className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white shadow-sm"/>
                            <div>
                                <div className="font-bold text-gray-800">{address.slice(0, 6)}...{address.slice(-4)}</div>
                                <a href={`https://testnet.bscscan.com/address/${address}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">View on BscScan</a>
                            </div>
                        </div>
                        <div className="py-4 space-y-3 text-sm">
                            <div className="flex justify-between items-center"><span className="text-gray-500">Network</span><span className={`font-semibold ${wrongNetwork ? 'text-red-500' : 'text-green-600'}`}>{wrongNetwork ? 'Wrong Network' : 'BNB Testnet'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-500">Balance</span><span className="font-semibold text-gray-800">{balance} tBNB</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-500">LP Tokens</span><span className="font-semibold text-gray-800">{lpBalance}</span></div>
                        </div>
                        <button onClick={handleDisconnect} className="w-full text-center bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 transition-all duration-200 font-semibold text-sm">
                            Disconnect
                        </button>
                    </div>
                  </Transition>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-wait disabled:scale-100"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Connect Wallet</span>
                  )}
                </button>
              )}

              {/* Hamburger (Mobile) */}
              <div className="lg:hidden">
                <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        <Transition
            show={mobileNavOpen}
            as={Fragment}
            enter="duration-300 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-200 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileNavOpen(false)}></div>
        </Transition>
        <Transition
            show={mobileNavOpen}
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
        >
            <div className="lg:hidden fixed top-0 left-0 w-80 h-full bg-white z-50 shadow-2xl flex flex-col p-6">
                <div className="flex items-center justify-between mb-8">
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src={logo} alt="MetaCow" className="w-12 h-12"/>
                        <span className="text-2xl font-bold text-gray-800">MetaCow</span>
                    </Link>
                    <button onClick={() => setMobileNavOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    
                    </button>
                </div>
                <div className="flex flex-col gap-3">
                    {navItems.map((item) => (
                        <NavLink key={item.path} item={item} />
                    ))}
                </div>
            </div>
        </Transition>
      </nav>
    </>
  );
}
