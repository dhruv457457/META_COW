import { FACTORY_ADDRESS, FACTORY_ABI, PAIR_ABI } from "./constants";
import { ethers } from "ethers";

// ✅ Get signer and provider
export async function getProviderAndSigner() {
const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

// ✅ Get Factory contract instance
export async function getFactoryContract() {
  const { signer } = await getProviderAndSigner();
  return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
}

// ✅ Get Pair contract instance
export async function getPairContract(pairAddress) {
  const { signer } = await getProviderAndSigner();
  return new ethers.Contract(pairAddress, PAIR_ABI, signer);
}

// ✅ Create a new token pair
export async function createPair(tokenA, tokenB) {
  const factory = await getFactoryContract();
  const tx = await factory.createPair(tokenA, tokenB);
  await tx.wait();
  return await factory.getPair(tokenA, tokenB);
}

// ✅ Execute a token swap
export async function swap(pairAddress, amountIn, tokenIn) {
  const pair = await getPairContract(pairAddress);
  const { signer } = await getProviderAndSigner();

  const tokenInContract = new ethers.Contract(
    tokenIn,
    ["function approve(address spender, uint256 amount) public returns (bool)"],
    signer
  );

  const approveTx = await tokenInContract.approve(pairAddress, amountIn);
  await approveTx.wait();

  const swapTx = await pair.swap(amountIn, tokenIn);
  return await swapTx.wait();
}

// ✅ Get reserves from a pair
export async function getReserves(pairAddress) {
  const pair = await getPairContract(pairAddress);
  const [reserveA, reserveB] = await pair.getReserves();
  return {
    reserveA: Number(ethers.formatUnits(reserveA, 18)),
    reserveB: Number(ethers.formatUnits(reserveB, 18)),
  };
}

// ✅ Get pair address for two tokens
export async function getPairAddress(tokenA, tokenB) {
  const factory = await getFactoryContract();
  return await factory.getPair(tokenA, tokenB);
}

// ✅ Get LP token balance for a user
export async function getLPBalance(pairAddress, userAddress) {
  const { provider } = await getProviderAndSigner();
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const balance = await pair.getLPBalance(userAddress); // ✅ FIXED
  return ethers.formatUnits(balance, 18);
}

// ✅ Add liquidity to a pair
export async function addLiquidity(
  pairAddress,
  amountA,
  amountB,
  tokenA,
  tokenB
) {
  const { signer } = await getProviderAndSigner();
  const userAddress = await signer.getAddress();

  // Sort tokens by address
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  const [amount0, amount1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [amountA, amountB]
      : [amountB, amountA];

  const token0Contract = new ethers.Contract(
    token0,
    ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)"],
    signer
  );

  const token1Contract = new ethers.Contract(
    token1,
    ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)"],
    signer
  );

  // Check balances
  const balance0 = await token0Contract.balanceOf(userAddress);
  const balance1 = await token1Contract.balanceOf(userAddress);

  if (balance0 < amount0)
    throw new Error("Insufficient token0 balance");
  if (balance1 < amount1)
    throw new Error("Insufficient token1 balance");

  // Approve
  await (await token0Contract.approve(pairAddress, amount0)).wait();
  await (await token1Contract.approve(pairAddress, amount1)).wait();

  const pair = new ethers.Contract(pairAddress, PAIR_ABI, signer);
  const tx = await pair.addLiquidity(amount0, amount1); // ALWAYS token0, token1
  return await tx.wait();
}

// ✅ Remove liquidity from a pair
export async function removeLiquidity(pairAddress, amountLP) {
  const { signer } = await getProviderAndSigner();
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, signer);
  const tx = await pair.removeLiquidity(amountLP);
  return await tx.wait();
}

// ✅ Claim rewards for user
export async function claimRewards(pairAddress) {
  const { signer } = await getProviderAndSigner();
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, signer);
  const tx = await pair.claimRewards();
  return await tx.wait();
}
// ✅ Get claimable rewards for a user
export async function getClaimableRewards(pairAddress, userAddress) {
  const { provider } = await getProviderAndSigner();
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const reward = await pair.getClaimableRewards(userAddress);
  return ethers.formatUnits(reward, 18);
}

export async function getReadOnlyProvider() {
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getFactoryContractReadOnly() {
  const provider = await getReadOnlyProvider();
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  return { factory, provider }; // ✅ return both
}

export async function getPairContractReadOnly(pairAddress) {
  const provider = await getReadOnlyProvider();
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  return { pair, provider }; // ✅ return both
}

export async function getPoolStats(pairAddress) {
  const { pair } = await getPairContractReadOnly(pairAddress);
  const [tvl, volume, apr] = await Promise.all([
    pair.getTVL(),
    pair.get24hVolume(),
    pair.getAPR(),
  ]);
  return {
    tvl: Number(ethers.formatUnits(tvl, 18)),
    volume: Number(ethers.formatUnits(volume, 18)),
    apr: Number(apr) / 100, // from basis points to %
  };
}
