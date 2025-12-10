// Define interfaces for ABIs
export const FACTORY_ADDRESS = "0x524Fec22546B087E91D198745CdD6ea94C057D79"; // Your BSC Testnet Factory

export const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function allPairs(uint256) external view returns (address pair)",
  "function allPairsLength() external view returns (uint256)",
  "function createPair(address tokenA, address tokenB) external returns (address pair)",
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
];

export const PAIR_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint)",
  "function balanceOf(address owner) external view returns (uint)",
  "function allowance(address owner, address spender) external view returns (uint)",
  "function approve(address spender, uint value) external returns (bool)",
  "function transfer(address to, uint value) external returns (bool)",
  "function transferFrom(address from, address to, uint value) external returns (bool)",
  "function MINIMUM_LIQUIDITY() external pure returns (uint)",
  "function factory() external view returns (address)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  // ✅ FIXED: MetaCow returns uint256 reserves, not uint112
  "function getReserves() external view returns (uint256 reserve0, uint256 reserve1)",
  "function price0CumulativeLast() external view returns (uint)",
  "function price1CumulativeLast() external view returns (uint)",
  "function kLast() external view returns (uint)",
  "function mint(address to) external returns (uint liquidity)",
  "function burn(address to) external returns (uint amount0, uint amount1)",
  "function swap(uint amount0Out, uint amount1Out, address to, bytes data) external",
  "function skim(address to) external",
  "function sync() external",
  "function initialize(address, address) external",
  // Custom MetaCow Functions
  "function getLPBalance(address user) external view returns (uint256)",
  "function claimRewards() external",
  "function getClaimableRewards(address user) external view returns (uint256)",
  "function getReputationScore(address user) external view returns (uint256)",
  // Stats
  "function getTVL() external view returns (uint256)",
  "function get24hVolume() external view returns (uint256)",
  "function getAPR() external view returns (uint256)",
  "function addLiquidity(uint256 amount0Desired, uint256 amount1Desired) external returns (uint256)",
  "function removeLiquidity(uint256 liquidity) external returns (uint256, uint256)",
  // ✅ ADDED: Custom swap function signature
  "function swap(uint256 amountIn, address tokenIn) external returns (uint256 amountOut)"
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint)",
  "function approve(address spender, uint value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint)",
  "function transfer(address to, uint value) returns (bool)",
  "function mint(address to, uint256 amount) external"
];