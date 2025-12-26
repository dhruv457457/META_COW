import { useState } from "react";
import { ethers } from "ethers";
import TokenSelector from "../TokenSelector";
import { showError, showSuccess, showWarning } from "../../utils/toast";
import { addLiquidity, removeLiquidity } from "../../utils/contractUtils";

export default function LiquidityForm({
  tokenA,
  setTokenA,
  tokenB,
  setTokenB,
  amountA,
  setAmountA,
  amountB,
  setAmountB,
  amountLP,
  setAmountLP,
  lpBalance,
  pairAddress,
  signer,
  address,
  onTxUpdate,
  loading,
  setLoading
}) {
  const [activeTab, setActiveTab] = useState("add");
const TOKEN_DECIMALS = {
  USDT: 18,
  TKA: 18,
  TKB: 18,
  MOO: 18,
  ETH: 18,
};

  const handleAdd = async () => {
  if (!pairAddress || !tokenA || !tokenB || !signer) {
    showWarning("Please select tokens and ensure wallet is connected.");
    return;
  }

  const numAmountA = parseFloat(amountA);
  const numAmountB = parseFloat(amountB);
  if (
    !amountA || !amountB || isNaN(numAmountA) || isNaN(numAmountB) ||
    numAmountA <= 0 || numAmountB <= 0
  ) {
    showWarning("Enter valid amounts > 0.");
    return;
  }

  try {
    setLoading(true);

    const decimalsA = TOKEN_DECIMALS[tokenA.symbol] || 18;
    const decimalsB = TOKEN_DECIMALS[tokenB.symbol] || 18;

    const parsedA = ethers.parseUnits(amountA, decimalsA);
    const parsedB = ethers.parseUnits(amountB, decimalsB);

    await addLiquidity(pairAddress, parsedA, parsedB, tokenA.address, tokenB.address);
    showSuccess("Liquidity added!");
    setAmountA("");
    setAmountB("");
    onTxUpdate?.();
  } catch (err) {
    console.error("Add liquidity error:", err);
    showError("Add failed.");
  } finally {
    setLoading(false);
  }
};


  const handleRemove = async () => {
    const numAmountLP = parseFloat(amountLP);
    const currentLP = parseFloat(lpBalance);
    if (!amountLP || isNaN(numAmountLP) || numAmountLP <= 0) {
      showWarning("Enter valid LP amount.");
      return;
    }
    if (numAmountLP > currentLP) {
      showError(`You only have ${lpBalance} LP tokens.`);
      return;
    }

    try {
      setLoading(true);
      const parsedLP = ethers.parseUnits(amountLP, 18);
      await removeLiquidity(pairAddress, parsedLP);
      showSuccess("Liquidity removed!");
      setAmountLP("");
      onTxUpdate?.();
    } catch (err) {
      console.error("Remove liquidity error:", err);
      showError("Remove failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="bg-white rounded-3xl p-6">
      {/* Tab Selector */}
      <div className="flex mb-6 bg-gray-100 rounded-full">
        {["add", "remove"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-semibold rounded-full transition ${
              activeTab === tab
                ? "bg-white shadow text-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab === "add" ? "💧 Add Liquidity" : "🔄 Remove Liquidity"}
          </button>
        ))}
      </div>

      {activeTab === "add" ? (
        <div className="space-y-4">
          {/* Token A */}
          <TokenSelector selected={tokenA} onSelect={setTokenA} />
          <input
            type="number"
            placeholder="Amount A"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border"
          />

          {/* Token B */}
          <TokenSelector selected={tokenB} onSelect={setTokenB} />
          <input
            type="number"
            placeholder="Amount B"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border"
          />

          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Liquidity"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            type="number"
            placeholder="LP Amount"
            value={amountLP}
            onChange={(e) => setAmountLP(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border"
          />
          <div className="text-sm text-gray-500">
            Available LP: {lpBalance}
          </div>

          <button
            onClick={handleRemove}
            disabled={loading}
            className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Removing..." : `Remove Liquidity`}
          </button>
        </div>
      )}
    </div>
  );
}
