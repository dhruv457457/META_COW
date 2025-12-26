const { ethers } = require("ethers");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const Feed = require("../models/Feed.js");
const User = require("../models/User.js");
const Follow = require("../models/Follow.js");
const Swap = require("../models/Swap.js"); // Make sure this exists

dotenv.config();



const RPC_URL = process.env.RPC_URL;
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Load ABIs
const pairAbi = JSON.parse(fs.readFileSync(path.join(__dirname, "Pair.json"), "utf8"));
const factoryAbi = JSON.parse(fs.readFileSync(path.join(__dirname, "Factory.json"), "utf8"));

const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi.abi, signer);

// In-memory tracking
const lastBlockSeen = {};
const pairContracts = [];

// 🧠 Reputation calculator
const getUserStats = async (userAddress) => {
  const swaps = await Swap.find({ user: userAddress });
  const totalVolume = swaps.reduce((sum, s) => sum + Number(s.inputAmount), 0);
  const profitTrades = swaps.filter((s) => Number(s.outputAmount) > Number(s.inputAmount)).length;
  const lossTrades = swaps.filter((s) => Number(s.outputAmount) < Number(s.inputAmount)).length;
  const profitLossScore = (profitTrades - lossTrades) * 1;
  const followerCount = await Follow.countDocuments({ following: userAddress });
  return {
    swapCount: swaps.length,
    totalVolume,
    followerCount,
    profitLossScore,
  };
};

// 🔁 Update on-chain score
const updateReputation = async (userAddress) => {
  try {
    const stats = await getUserStats(userAddress);
    const score =
      stats.swapCount * 2 +
      stats.totalVolume * 0.1 +
      stats.followerCount * 3 +
      stats.profitLossScore;

    const tx = await factory.updateReputation(userAddress, Math.floor(score));
    await tx.wait();
    console.log(`✅ Reputation updated for ${userAddress}: ${Math.floor(score)}`);
  } catch (err) {
    console.error(`❌ Failed to update reputation for ${userAddress}:`, err.message);
  }
};

// 🛰️ Start listener
async function startSwapListener() {
  const pairCount = await factory.allPairsLength();
  console.log(`🔍 Found ${pairCount} pairs. Starting staggered polling...`);

  for (let i = 0; i < pairCount; i++) {
    const pairAddress = await factory.allPairs(i);
    const contract = new ethers.Contract(pairAddress, pairAbi.abi, provider);
    pairContracts.push({ contract, address: pairAddress });
    lastBlockSeen[pairAddress] = (await provider.getBlockNumber()) - 3;
  }

  let currentIndex = 0;

  setInterval(async () => {
    const { contract, address } = pairContracts[currentIndex];
    const fromBlock = lastBlockSeen[address];
    const toBlock = await provider.getBlockNumber();

    if (toBlock <= fromBlock) {
      currentIndex = (currentIndex + 1) % pairContracts.length;
      return;
    }

    const allLogs = [];
    let start = fromBlock;

    while (start <= toBlock) {
      const end = Math.min(start + 99, toBlock);
      try {
        const chunkLogs = await contract.queryFilter("Swapped", start, end);
        allLogs.push(...chunkLogs);
      } catch (err) {
        console.error(`❌ Error polling ${address} from ${start} to ${end}: ${err.message}`);
      }
      start = end + 1;
    }

    for (const log of allLogs) {
      const { user, inputToken, outputToken, inputAmount, outputAmount } = log.args;
      const lowerUser = user.toLowerCase();

      // 1️⃣ Save Swap to DB
      await Swap.create({
        user: lowerUser,
        inputToken,
        outputToken,
        inputAmount: inputAmount.toString(),
        outputAmount: outputAmount.toString(),
        txHash: log.transactionHash,
        timestamp: Date.now(),
      });

      // 2️⃣ Update feed
      const userProfile = await User.findOne({ wallet: lowerUser });
      if (!userProfile) {
        console.log(`⚠️ No user profile found for ${lowerUser}`);
        continue;
      }

      const followedBy = await Follow.find({ following: userProfile._id }).populate("follower");
      if (followedBy.length > 0) {
        for (const follow of followedBy) {
          const followerWallet = follow.follower.wallet.toLowerCase();

          await Feed.updateOne(
            { owner: followerWallet },
            {
              $push: {
                events: {
                  type: "copyTrade",
                  actor: lowerUser,
                  tokenIn: inputToken,
                  tokenOut: outputToken,
                  amountIn: inputAmount.toString(),
                  amountOut: outputAmount.toString(),
                  timestamp: Math.floor(Date.now() / 1000),
                  txHash: log.transactionHash,
                },
              },
            },
            { upsert: true }
          );
        }

        console.log(`📡 Swap by ${lowerUser} → Updated feeds for ${followedBy.length} followers.`);
      }

      // 3️⃣ Update on-chain rep
      await updateReputation(lowerUser);
    }

    lastBlockSeen[address] = toBlock;
    currentIndex = (currentIndex + 1) % pairContracts.length;
  }, 5000);
}

startSwapListener();
