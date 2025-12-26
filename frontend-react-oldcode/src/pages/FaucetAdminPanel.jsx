import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { useWallet } from "../contexts/WalletContext";
import TokenSelector from "../components/TokenSelector";
import { createPair, getFactoryContract } from "../utils/contractUtils";

import { tokenList } from "../utils/constants";

const FAUCET_ADDRESS = "0xD1504b93610AaA68C1F93165120b7b2B906ae9A8";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];
const FAUCET_ABI = [
  "function deposit(address token, uint256 amount) public",
];

export default function FaucetAdminPanel() {
  const { walletData } = useWallet();
  const address = walletData?.address;
  const isConnected = !!address;

  const [selectedToken, setSelectedToken] = useState(tokenList[0]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenA, setTokenA] = useState(null);
  const [tokenB, setTokenB] = useState(null);
  const [pairAddress, setPairAddress] = useState("");
  const [status, setStatus] = useState("");
  const [existingPairs, setExistingPairs] = useState([]);
  const [creatingPair, setCreatingPair] = useState(false);

  const handleDeposit = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(selectedToken.address, ERC20_ABI, signer);
      const faucetContract = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);

      const amountInWei = ethers.parseUnits(amount, 18);

      setLoading(true);
      toast.loading("Approving token...");

      const approveTx = await tokenContract.approve(FAUCET_ADDRESS, amountInWei);
      await approveTx.wait();

      toast.dismiss();
      toast.loading("Depositing to faucet...");

      const depositTx = await faucetContract.deposit(selectedToken.address, amountInWei);
      await depositTx.wait();

      toast.dismiss();
      toast.success("✅ Tokens deposited to faucet!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("❌ Failed to deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePair = async () => {
    try {
      if (!tokenA || !tokenB || !ethers.isAddress(tokenA.address) || !ethers.isAddress(tokenB.address)) {
        return setStatus("❌ Please select valid token addresses.");
      }
      setCreatingPair(true);
      setStatus("⏳ Creating pair...");
      const pair = await createPair(tokenA.address, tokenB.address);
      setPairAddress(pair);
      setStatus(`✅ Pair created successfully!`);
      fetchExistingPairs();
    } catch (err) {
      console.error("Create pair failed", err);
      setStatus("❌ Failed to create pair. Check console.");
    } finally {
      setCreatingPair(false);
    }
  };

  const fetchExistingPairs = async () => {
    try {
      const factory = await getFactoryContract();
      const count = await factory.allPairsLength();
      const pairs = [];
      for (let i = 0; i < count; i++) {
        const pairAddr = await factory.allPairs(i);
        pairs.push(pairAddr);
      }
      setExistingPairs(pairs);
    } catch (err) {
      console.error("Failed to fetch pairs", err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchExistingPairs();
    }
  }, [isConnected]);

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-10">
      {/* Faucet Admin */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold mb-6">💧 Faucet Admin Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Select Token</label>
            <select
              value={selectedToken.symbol}
              onChange={(e) => setSelectedToken(tokenList.find((t) => t.symbol === e.target.value))}
              className="w-full p-3 rounded-xl border border-gray-300"
            >
              {tokenList.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">Amount to Deposit</label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300"
            />
          </div>
        </div>
        <button
          onClick={handleDeposit}
          disabled={loading || !amount}
          className={`mt-6 w-full py-4 rounded-xl font-semibold text-white text-lg transition-all ${
            loading || !amount
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
          }`}
        >
          {loading ? "Processing..." : `Deposit ${amount} ${selectedToken.symbol}`}
        </button>
      </div>

      {/* Pair Creation Admin */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold mb-6">⚡ Create Trading Pair</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Token A</label>
            <TokenSelector selected={tokenA} onSelect={setTokenA} />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">Token B</label>
            <TokenSelector selected={tokenB} onSelect={setTokenB} />
          </div>
        </div>
        <button
          onClick={handleCreatePair}
          disabled={creatingPair || !tokenA || !tokenB}
          className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl transition-all"
        >
          {creatingPair ? "Creating..." : "Create Pair"}
        </button>
        {status && (
          <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
            {status}
            {pairAddress && <div className="mt-2 font-mono break-words">{pairAddress}</div>}
          </div>
        )}
      </div>

      {/* Existing Pairs Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold mb-6">📦 Existing Trading Pairs</h2>
        {existingPairs.length === 0 ? (
          <p className="text-gray-500">No trading pairs created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingPairs.map((pair, index) => (
              <div key={index} className="p-4 border rounded-xl bg-gray-50">
                <div className="font-medium text-gray-700">Pair #{index + 1}</div>
                <div className="font-mono text-sm break-all text-gray-600">{pair}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}