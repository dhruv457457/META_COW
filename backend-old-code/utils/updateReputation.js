require("dotenv").config();
const { ethers } = require("ethers");
const factoryABI = require("../abis/Factory.json").abi;

// Replace with your MongoDB models if you're using them
const dummyDB = {
  async getUserStats(address) {
    // Replace with actual DB query
    return {
      swapCount: 12,
      totalVolume: 4550, // in USDC
      followerCount: 4,
    };
  },
};

async function updateReputationForUser(userAddress) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const factory = new ethers.Contract(process.env.FACTORY_ADDRESS, factoryABI, wallet);

  const stats = await dummyDB.getUserStats(userAddress);
  const score =
    stats.swapCount * 2 + stats.totalVolume * 0.1 + stats.followerCount * 3;

  const tx = await factory.updateReputation(userAddress, Math.floor(score));
  console.log(`Reputation tx sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Reputation updated: ${userAddress} → ${score}`);
}

// Example usage:
updateReputationForUser("0xUserAddressHere");
