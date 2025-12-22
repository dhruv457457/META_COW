"use client";

import { useState, useEffect } from "react";
import TokenSelector from "@/components/TokenSelector";
import { addLiquidity, removeLiquidity } from "@/utils/contractUtils";
import { Token } from "@/utils/tokens";
import { toast } from "react-hot-toast";
import { ethers, Contract, BrowserProvider } from "ethers";
import { ERC20_ABI } from "@/utils/constants";
import { useWallet } from "@/context/WalletContext";

interface LiquidityFormProps {
  tokenA: Token | null;
  setTokenA: (t: Token) => void;
  tokenB: Token | null;
  setTokenB: (t: Token) => void;
  lpBalance: string;
  pairAddress: string;
  onTxUpdate: () => void;
}

export default function LiquidityForm({
  tokenA,
  setTokenA,
  tokenB,
  setTokenB,
  lpBalance,
  pairAddress,
  onTxUpdate,
}: LiquidityFormProps) {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<"add" | "remove">("add");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [amountLP, setAmountLP] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [approvedA, setApprovedA] = useState(false);
  const [approvedB, setApprovedB] = useState(false);
  const [balanceA, setBalanceA] = useState("0");
  const [balanceB, setBalanceB] = useState("0");

  // ✅ Check allowances AND balances
  useEffect(() => {
    const checkAllowanceAndBalance = async () => {
      if (!address || !tokenA || !tokenB || !pairAddress) return;
      try {
        const provider = new BrowserProvider(window.ethereum);
        const tka = new Contract(tokenA.address, ERC20_ABI, provider);
        const tkb = new Contract(tokenB.address, ERC20_ABI, provider);

        const [allowA, allowB, balA, balB] = await Promise.all([
          tka.allowance(address, pairAddress),
          tkb.allowance(address, pairAddress),
          tka.balanceOf(address),
          tkb.balanceOf(address)
        ]);

        // Convert inputs to BigInt for comparison
        const weiA = amountA ? ethers.parseUnits(amountA, 18) : 0n;
        const weiB = amountB ? ethers.parseUnits(amountB, 18) : 0n;

        // Set approval status
        setApprovedA(weiA > 0n ? allowA >= weiA : false);
        setApprovedB(weiB > 0n ? allowB >= weiB : false);
        
        // Set balances for display
        setBalanceA(ethers.formatUnits(balA, 18));
        setBalanceB(ethers.formatUnits(balB, 18));
        
      } catch (err) {
        console.error("Allowance/Balance check failed", err);
      }
    };
    
    const timer = setTimeout(checkAllowanceAndBalance, 500);
    return () => clearTimeout(timer);
  }, [address, tokenA, tokenB, pairAddress, amountA, amountB]);

  const handleApprove = async (token: Token, setApproved: (val: boolean) => void) => {
    if (!pairAddress) return;
    try {
      setLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new Contract(token.address, ERC20_ABI, signer);
      
      const tx = await tokenContract.approve(pairAddress, ethers.MaxUint256);
      toast.loading(`Approving ${token.symbol}...`);
      await tx.wait();
      
      toast.dismiss();
      toast.success(`${token.symbol} Approved!`);
      setApproved(true);
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error(err.reason || err.message || "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!pairAddress || !tokenA || !tokenB) return;
    
    // Validate balances
    const weiA = ethers.parseUnits(amountA, 18);
    const weiB = ethers.parseUnits(amountB, 18);
    const balA = ethers.parseUnits(balanceA, 18);
    const balB = ethers.parseUnits(balanceB, 18);

    if (weiA > balA) {
      toast.error(`Insufficient ${tokenA.symbol} balance`);
      return;
    }
    if (weiB > balB) {
      toast.error(`Insufficient ${tokenB.symbol} balance`);
      return;
    }

    try {
      setLoading(true);
      await addLiquidity(pairAddress, amountA, amountB, tokenA.address, tokenB.address);
      toast.success("Liquidity Added!");
      setAmountA("");
      setAmountB("");
      onTxUpdate();
    } catch (err: any) {
      console.error(err);
      
      // Better error messages
      let errorMsg = "Add Liquidity Failed";
      if (err.message?.includes("Insufficient")) {
        errorMsg = err.message;
      } else if (err.reason) {
        errorMsg = err.reason;
      } else if (err.message?.includes("user rejected")) {
        errorMsg = "Transaction cancelled";
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!amountLP || parseFloat(amountLP) <= 0) return;
    try {
      setLoading(true);
      await removeLiquidity(pairAddress, amountLP);
      toast.success("Liquidity Removed!");
      setAmountLP("");
      onTxUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.reason || err.message || "Remove failed");
    } finally {
      setLoading(false);
    }
  };

  // Check if amounts exceed balances
  const isInsufficientBalanceA = amountA && parseFloat(amountA) > parseFloat(balanceA);
  const isInsufficientBalanceB = amountB && parseFloat(amountB) > parseFloat(balanceB);
  const canAddLiquidity = approvedA && approvedB && amountA && amountB && 
                          !isInsufficientBalanceA && !isInsufficientBalanceB;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 relative ">
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab("add")}
          className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide transition-colors rounded-tl-3xl ${
            activeTab === "add" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab("remove")}
          className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide transition-colors rounded-tr-3xl ${
            activeTab === "remove" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Remove Liquidity
        </button>
      </div>

      <div className="p-8">
        {activeTab === "add" ? (
          <div className="space-y-6">
            {/* Input A */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Token A Input</label>
                {tokenA && (
                  <span className="text-xs text-gray-400">
                    Balance: {parseFloat(balanceA).toFixed(4)} {tokenA.symbol}
                  </span>
                )}
              </div>
              <div className={`flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border relative z-20 ${
                isInsufficientBalanceA ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                  className={`w-full bg-transparent text-2xl font-bold outline-none ${
                    isInsufficientBalanceA ? 'text-red-600' : 'text-gray-800'
                  }`}
                />
                <TokenSelector selected={tokenA} onSelect={setTokenA} />
              </div>
              {isInsufficientBalanceA && (
                <p className="text-xs text-red-600 ml-1">Insufficient balance</p>
              )}
            </div>

            <div className="flex justify-center text-gray-400">+</div>

            {/* Input B */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Token B Input</label>
                {tokenB && (
                  <span className="text-xs text-gray-400">
                    Balance: {parseFloat(balanceB).toFixed(4)} {tokenB.symbol}
                  </span>
                )}
              </div>
              <div className={`flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border relative z-10 ${
                isInsufficientBalanceB ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                  className={`w-full bg-transparent text-2xl font-bold outline-none ${
                    isInsufficientBalanceB ? 'text-red-600' : 'text-gray-800'
                  }`}
                />
                <TokenSelector selected={tokenB} onSelect={setTokenB} />
              </div>
              {isInsufficientBalanceB && (
                <p className="text-xs text-red-600 ml-1">Insufficient balance</p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 relative z-0">
              {/* Approve A */}
              {!approvedA && amountA && parseFloat(amountA) > 0 && tokenA && (
                <button
                  onClick={() => handleApprove(tokenA, setApprovedA)}
                  disabled={loading}
                  className="w-full py-3 bg-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-200 transition disabled:opacity-50"
                >
                  {loading ? "Processing..." : `Approve ${tokenA.symbol}`}
                </button>
              )}
              
              {/* Approve B */}
              {!approvedB && amountB && parseFloat(amountB) > 0 && tokenB && (
                <button
                  onClick={() => handleApprove(tokenB, setApprovedB)}
                  disabled={loading}
                  className="w-full py-3 bg-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-200 transition disabled:opacity-50"
                >
                  {loading ? "Processing..." : `Approve ${tokenB.symbol}`}
                </button>
              )}

              {/* Add Liquidity Button */}
              <button
                onClick={handleAdd}
                disabled={loading || !canAddLiquidity}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] ${
                  !canAddLiquidity
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/30"
                }`}
              >
                {loading ? "Adding..." : 
                 (!amountA || !amountB) ? "Enter Amounts" : 
                 (isInsufficientBalanceA || isInsufficientBalanceB) ? "Insufficient Balance" :
                 (!approvedA || !approvedB) ? "Approve Tokens First" : 
                 "Add Liquidity"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
              <p className="text-sm text-red-600 font-medium">Available to Remove</p>
              <p className="text-3xl font-bold text-red-800">{parseFloat(lpBalance).toFixed(4)} LP</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <input
                type="number"
                placeholder="0.0"
                value={amountLP}
                onChange={(e) => setAmountLP(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-gray-800 outline-none"
              />
              <span className="font-bold text-gray-500">LP</span>
            </div>
            <button
              onClick={handleRemove}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
            >
              {loading ? "Removing..." : "Remove Liquidity"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}