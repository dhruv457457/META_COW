// src/services/copyTradeMonitor.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { fetchLatestSwaps } from "@/utils/envioClient";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";
import { executeCopyTrade } from "./tradeExecutor";

let processedSwaps = new Set<string>();

/**
 * Monitor for new swaps and execute copy trades
 */
async function monitorSwaps() {
  try {
    console.log("🔍 Checking for new swaps...");
    
    await dbConnect();

    // Fetch latest swaps from Envio
    const swaps = await fetchLatestSwaps(20);
    
    // Get all active permissions from MongoDB
    const activePermissions = await CopyTradePermission.find({ 
      isActive: true 
    });

    if (activePermissions.length === 0) {
      console.log("   No active copy trade permissions found");
      return;
    }

    console.log(`   Found ${activePermissions.length} active permissions`);

    // Check each swap
    for (const swap of swaps) {
      const swapId = `${swap.txHash}-${swap.timestamp}`;
      
      // Skip if already processed
      if (processedSwaps.has(swapId)) continue;
      
      // Mark as processed
      processedSwaps.add(swapId);
      
      // Find permissions for this trader
      const permissions = activePermissions.filter(
        (p) => p.traderAddress.toLowerCase() === swap.user.toLowerCase()
      );

      if (permissions.length === 0) continue;

      console.log(`\n🎯 New swap detected from ${swap.user.slice(0, 10)}...`);
      console.log(`   Input: ${swap.inputToken.slice(0, 10)}...`);
      console.log(`   Output: ${swap.outputToken.slice(0, 10)}...`);
      console.log(`   ${permissions.length} copiers found`);

      // Execute copy trade for each permission
      for (const permission of permissions) {
        try {
          // Check if permission expired
          if (new Date() > permission.expiresAt) {
            console.log(`   ⏰ Permission expired for ${permission.userWallet}`);
            await CopyTradePermission.findByIdAndUpdate(permission._id, {
              isActive: false,
            });
            continue;
          }

          // Check daily limit
          const dailyLimit = parseFloat(permission.dailyLimit);
          const spentToday = parseFloat(permission.spentToday);

          // Reset daily spending if needed (24h passed)
          const now = new Date();
          const lastReset = new Date(permission.lastResetAt);
          const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
          
          let currentSpent = spentToday;
          if (hoursSinceReset >= 24) {
            console.log(`   🔄 Resetting daily limit for ${permission.userWallet.slice(0, 10)}...`);
            currentSpent = 0;
            await CopyTradePermission.findByIdAndUpdate(permission._id, {
              spentToday: "0",
              lastResetAt: now,
            });
          }

          // Calculate copy amount (10% of original trade for demo)
          const copyAmount = parseFloat(swap.inputAmount) * 0.1 / 1e18;

          // Check if within daily limit
          if (currentSpent + copyAmount > dailyLimit) {
            console.log(`   💰 Daily limit reached for ${permission.userWallet.slice(0, 10)}...`);
            console.log(`      Spent: ${currentSpent}/${dailyLimit} tokens`);
            continue;
          }

          // Execute the copy trade
          console.log(`   ⚡ Executing copy trade for ${permission.userWallet.slice(0, 10)}...`);
          
          const userOpHash = await executeCopyTrade({
            permission: {
              userWallet: permission.userWallet,
              sessionAccount: permission.sessionAccount,
permissionsContext: permission.permissionsContext as `0x${string}`,              delegationManager: permission.delegationManager,
              _id: permission._id,
            },
            swap: {
              user: swap.user,
              inputToken: swap.inputToken,
              outputToken: swap.outputToken,
              inputAmount: swap.inputAmount,
              txHash: swap.txHash,
            },
            amount: copyAmount,
          });

          console.log(`   ✅ Copy trade executed! UserOp: ${userOpHash}`);

          // Update spent amount
          await CopyTradePermission.findByIdAndUpdate(permission._id, {
            spentToday: (currentSpent + copyAmount).toString(),
          });
          
        } catch (error: any) {
          console.error(`   ❌ Failed to copy trade for ${permission.userWallet.slice(0, 10)}...`);
          console.error(`      Error: ${error.message}`);
        }
      }
    }

    // Clean up old processed swaps (keep last 1000)
    if (processedSwaps.size > 1000) {
      const swapsArray = Array.from(processedSwaps);
      processedSwaps = new Set(swapsArray.slice(-1000));
    }

  } catch (error: any) {
    console.error("❌ Monitor error:", error.message);
  }
}

/**
 * Start the monitor service
 */
async function startMonitor() {
  console.log("🚀 Copy Trade Monitor Started");
  console.log("   Checking every 10 seconds...");
  console.log("   Press Ctrl+C to stop\n");

  // Initial check
  await monitorSwaps();

  // Check every 10 seconds
  setInterval(monitorSwaps, 10000);
}

// Start if run directly
if (require.main === module) {
  startMonitor().catch(console.error);
}

export { monitorSwaps, startMonitor };