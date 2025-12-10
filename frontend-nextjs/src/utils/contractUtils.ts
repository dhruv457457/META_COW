import { ethers, BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { FACTORY_ADDRESS, FACTORY_ABI, PAIR_ABI, ERC20_ABI } from "./constants";

// Helper to get a provider/signer easily
async function getProviderAndSigner() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No crypto wallet found");
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

// Read-only provider (no wallet signature needed)
async function getReadOnlyProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    // Fallback to RPC if no wallet (optional)
    return new ethers.JsonRpcProvider("https://bnb-testnet.g.alchemy.com/v2/prb3bBkj1v9clt6hCTvVqcOBOCCHgLc6");
  }
  return new BrowserProvider(window.ethereum);
}

// --- Factory Functions ---

export async function getFactoryContract() {
  const { signer } = await getProviderAndSigner();
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
}

export async function getPairAddress(tokenA: string, tokenB: string): Promise<string> {
  const provider = await getReadOnlyProvider();
  const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  return await factory.getPair(tokenA, tokenB);
}

export async function createPair(tokenA: string, tokenB: string) {
  const factory = await getFactoryContract();
  const tx = await factory.createPair(tokenA, tokenB);
  await tx.wait();
  return await factory.getPair(tokenA, tokenB);
}

// --- Pair / Swap Functions ---

export async function getReserves(pairAddress: string) {
  const provider = await getReadOnlyProvider();
  const pair = new Contract(pairAddress, PAIR_ABI, provider);
  try {
    // MetaCow returns (uint256, uint256) not the standard (uint112, uint112, uint32)
    const result = await pair.getReserves();
    return { 
      reserve0: result[0], 
      reserve1: result[1] 
    };
  } catch (error: any) {
    console.error("getReserves error:", error);
    throw new Error(`Failed to fetch reserves: ${error.message}`);
  }
}

export async function swap(pairAddress: string, amountIn: string, tokenIn: string) {
  const { signer } = await getProviderAndSigner();
  const userAddress = await signer.getAddress();
  
  // 1. Parse amount
  const amountWei = parseUnits(amountIn, 18);
  
  // 2. Check balance
  const tokenContract = new Contract(tokenIn, ERC20_ABI, signer);
  const balance = await tokenContract.balanceOf(userAddress);
  
  if (balance < amountWei) {
    throw new Error("Insufficient token balance");
  }
  
  // 3. Check/Set Allowance
  const allowance = await tokenContract.allowance(userAddress, pairAddress);
  
  if (allowance < amountWei) {
    const approveTx = await tokenContract.approve(pairAddress, ethers.MaxUint256);
    await approveTx.wait();
  }

  // 4. Execute Swap (MetaCow custom function)
  const pair = new Contract(pairAddress, PAIR_ABI, signer);
  const swapTx = await pair.swap(amountWei, tokenIn);
  return await swapTx.wait();
}

// --- Liquidity Functions ---

export async function addLiquidity(
  pairAddress: string,
  amountA: string,
  amountB: string,
  tokenA: string,
  tokenB: string
) {
  const { signer } = await getProviderAndSigner();
  const userAddress = await signer.getAddress();

  // Sort tokens to match contract sorting (token0 < token1)
  const isTokenALower = tokenA.toLowerCase() < tokenB.toLowerCase();
  const [token0, token1] = isTokenALower ? [tokenA, tokenB] : [tokenB, tokenA];
  const [amount0Str, amount1Str] = isTokenALower ? [amountA, amountB] : [amountB, amountA];

  const amount0Wei = parseUnits(amount0Str, 18);
  const amount1Wei = parseUnits(amount1Str, 18);

  // ✅ Approvals are handled in the UI before calling this function
  // No redundant approvals here to avoid conflicts

  // Verify balances before attempting transaction
  const token0Contract = new Contract(token0, ERC20_ABI, signer);
  const token1Contract = new Contract(token1, ERC20_ABI, signer);
  
  const [balance0, balance1] = await Promise.all([
    token0Contract.balanceOf(userAddress),
    token1Contract.balanceOf(userAddress)
  ]);

  if (balance0 < amount0Wei) {
    throw new Error(`Insufficient ${isTokenALower ? 'Token A' : 'Token B'} balance`);
  }
  if (balance1 < amount1Wei) {
    throw new Error(`Insufficient ${isTokenALower ? 'Token B' : 'Token A'} balance`);
  }

  // Verify allowances
  const [allowance0, allowance1] = await Promise.all([
    token0Contract.allowance(userAddress, pairAddress),
    token1Contract.allowance(userAddress, pairAddress)
  ]);

  if (allowance0 < amount0Wei) {
    throw new Error(`Insufficient allowance for ${isTokenALower ? 'Token A' : 'Token B'}. Please approve first.`);
  }
  if (allowance1 < amount1Wei) {
    throw new Error(`Insufficient allowance for ${isTokenALower ? 'Token B' : 'Token A'}. Please approve first.`);
  }

  // Add Liquidity
  const pair = new Contract(pairAddress, PAIR_ABI, signer);
  const tx = await pair.addLiquidity(amount0Wei, amount1Wei);
  return await tx.wait();
}

export async function removeLiquidity(pairAddress: string, amountLP: string) {
  const { signer } = await getProviderAndSigner();
  const pair = new Contract(pairAddress, PAIR_ABI, signer);
  
  const amountWei = parseUnits(amountLP, 18);
  const tx = await pair.removeLiquidity(amountWei);
  return await tx.wait();
}

export async function getLPBalance(pairAddress: string, userAddress: string) {
  const provider = await getReadOnlyProvider();
  const pair = new Contract(pairAddress, PAIR_ABI, provider);
  try {
    const balance = await pair.getLPBalance(userAddress);
    return formatUnits(balance, 18);
  } catch (error) {
    console.error("Error fetching LP balance", error);
    return "0";
  }
}

// --- Rewards & Stats ---

export async function getClaimableRewards(pairAddress: string, userAddress: string) {
  const provider = await getReadOnlyProvider();
  const pair = new Contract(pairAddress, PAIR_ABI, provider);
  try {
    const reward = await pair.getClaimableRewards(userAddress);
    return formatUnits(reward, 18);
  } catch (e) {
    return "0";
  }
}

export async function claimRewards(pairAddress: string) {
  const { signer } = await getProviderAndSigner();
  const pair = new Contract(pairAddress, PAIR_ABI, signer);
  const tx = await pair.claimRewards();
  return await tx.wait();
}

export async function getPoolStats(pairAddress: string) {
  const provider = await getReadOnlyProvider();
  const pair = new Contract(pairAddress, PAIR_ABI, provider);
  
  try {
    const [tvl, volume, apr] = await Promise.all([
      pair.getTVL(),
      pair.get24hVolume(),
      pair.getAPR(),
    ]);

    return {
      tvl: parseFloat(formatUnits(tvl, 18)),
      volume: parseFloat(formatUnits(volume, 18)),
      apr: Number(apr) / 100, // Basis points to %
    };
  } catch (e) {
    return { tvl: 0, volume: 0, apr: 0 };
  }
}