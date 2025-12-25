"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { Transition } from "@headlessui/react";

const BNB_TESTNET_CHAIN_ID = "97";
const BNB_TESTNET_PARAMS = {
  chainId: "0x61",
  chainName: "Binance Smart Chain Testnet",
  nativeCurrency: { name: "Binance Coin", symbol: "tBNB", decimals: 18 },
  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

// --- Icons ---
const HomeIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
  </svg>
);

const SwapIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M6.99 11 3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
  </svg>
);

const LiquidityIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const SocialIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const FaucetIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z" />
  </svg>
);

const ProfileIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const WalletIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

const MenuIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

const CloseIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

export default function Navbar() {
  const { connectWallet, disconnect, address, isConnected, chainId, balance, isConnecting } = useWallet();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  useEffect(() => {
    if (isConnected && chainId && chainId !== BNB_TESTNET_CHAIN_ID) {
      setWrongNetwork(true);
    } else {
      setWrongNetwork(false);
    }
  }, [isConnected, chainId]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest('.wallet-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileNavOpen]);

  const handleSwitchNetwork = async () => {
    if (!window.ethereum) return alert("MetaMask not found");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BNB_TESTNET_PARAMS.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BNB_TESTNET_PARAMS],
          });
        } catch (addError) {
          console.error("Failed to add network");
        }
      } else {
        console.error("Failed to switch network");
      }
    }
  };

  const navItems = [
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/swap", label: "Swap", icon: SwapIcon },
    { path: "/liquidity", label: "Liquidity", icon: LiquidityIcon },
    { path: "/social", label: "Social", icon: SocialIcon },
    { path: "/faucet", label: "Faucet", icon: FaucetIcon },
    { path: "/profile", label: "Profile", icon: ProfileIcon },
  ];

  return (
    <>
      {/* Wrong Network Banner */}
      {isConnected && wrongNetwork && (
        <div className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-center gap-4 py-3 px-4 text-sm font-bold z-50 shadow-lg">
          <span className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="hidden sm:inline">Wrong Network Detected</span>
            <span className="sm:hidden">Wrong Network</span>
          </span>
          <button
            onClick={handleSwitchNetwork}
            className="bg-white text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-50 transition text-xs font-bold shadow-sm hover:shadow-md transform hover:scale-105"
          >
            Switch to BNB Testnet
          </button>
        </div>
      )}

      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* LEFT: Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative">
                  <img 
                    src="/assets/metacow-logo.png" 
                    alt="MetaCow" 
                    className="w-10 h-10 lg:w-12 lg:h-12 object-contain group-hover:scale-110 transition-transform" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl lg:text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    MetaCow
                  </span>
                  <div className="text-xs text-gray-500 font-medium -mt-1">DEX</div>
                </div>
              </Link>
            </div>

            {/* CENTER: Nav (Desktop) */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm group ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30"
                        : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* RIGHT: Wallet */}
            <div className="flex items-center gap-2 sm:gap-4">
              {isConnected && address ? (
                <div className="relative wallet-dropdown">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 bg-white border-2 border-gray-200 pl-2 pr-3 py-2 rounded-full hover:border-purple-400 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-inner">
                      <WalletIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold text-gray-800">
                        {parseFloat(balance).toFixed(3)} tBNB
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {address.slice(0, 4)}...{address.slice(-3)}
                      </div>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform hidden sm:block ${showDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
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
                    <div className="absolute right-0 mt-3 w-80 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl p-4 z-50 origin-top-right">
                      {/* Profile Section */}
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-2xl shadow-lg">
                          🐮
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 text-sm truncate">
                            {address.slice(0, 8)}...{address.slice(-6)}
                          </div>
                          <a 
                            href={`https://testnet.bscscan.com/address/${address}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View on BscScan
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="py-4 space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Network</span>
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                            wrongNetwork 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {wrongNetwork ? '⚠️ Wrong Network' : '✅ BNB Testnet'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Balance</span>
                          <span className="font-bold text-gray-800">
                            {parseFloat(balance).toFixed(4)} tBNB
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-100 space-y-2">
                        <Link
                          href="/profile"
                          onClick={() => setShowDropdown(false)}
                          className="w-full flex items-center justify-center gap-2 bg-purple-50 text-purple-600 py-2.5 rounded-xl hover:bg-purple-100 transition-all duration-200 font-bold text-sm"
                        >
                          <ProfileIcon className="w-4 h-4" />
                          View Profile
                        </Link>
                        <button 
                          onClick={() => { disconnect(); setShowDropdown(false); }} 
                          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-xl hover:bg-red-100 transition-all duration-200 font-bold text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-wait disabled:scale-100 text-sm lg:text-base"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <WalletIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Connect Wallet</span>
                      <span className="sm:hidden">Connect</span>
                    </>
                  )}
                </button>
              )}

              {/* Hamburger (Mobile) */}
              <button 
                onClick={() => setMobileNavOpen(!mobileNavOpen)} 
                className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                aria-label="Toggle menu"
              >
                {mobileNavOpen ? (
                  <CloseIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Overlay & Drawer */}
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
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
          onClick={() => setMobileNavOpen(false)}
        />
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
        <div className="lg:hidden fixed top-0 left-0 w-[85%] max-w-sm h-full bg-white z-50 shadow-2xl flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileNavOpen(false)}>
              <img src="/assets/metacow-logo.png" alt="MetaCow" className="w-10 h-10" />
              <div>
                <span className="text-xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  MetaCow
                </span>
                <div className="text-xs text-gray-500 font-medium -mt-0.5">DEX</div>
              </div>
            </Link>
            <button 
              onClick={() => setMobileNavOpen(false)} 
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <CloseIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-base">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-center text-gray-500 mb-2">
              Powered by
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <img 
                src="https://docs.metamask.io/img/metamask-logo-dark.svg" 
                alt="MetaMask" 
                className="h-6 opacity-60" 
              />
              <img 
                src="https://docs.envio.dev/img/envio-logo.png" 
                alt="Envio" 
                className="h-6 opacity-60" 
              />
            </div>
            <div className="text-xs text-center text-gray-400">
              © 2025 MetaCow DEX
            </div>
          </div>
        </div>
      </Transition>
    </>
  );
}