// src/services/copyTradeMonitor.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { fetchLatestSwaps } from "@/utils/envioClient";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";
import { executeCopyTrade } from "./tradeExecutor";
import { formatUnits } from "viem";

let processedSwaps = new Set<string>();

/**
 * Monitor for new swaps and execute copy trades
 */
async function monitorSwaps() {
  try {
    await dbConnect();

    // 1. Fetch latest swaps from Envio
    const swaps = await fetchLatestSwaps(20);
    
    // 2. Get all active permissions
    const activePermissions = await CopyTradePermission.find({ 
      isActive: true 
    });

    if (activePermissions.length === 0) return;

    // 3. Process each swap
    for (const swap of swaps) {
      const swapId = `${swap.txHash}-${swap.timestamp}`;
      
      // Skip if already processed
      if (processedSwaps.has(swapId)) continue;
      
      // Add to processed set
      processedSwaps.add(swapId);
      
      // ✅ UPDATED: Find copiers for this specific trader AND token
      const copiers = activePermissions.filter(
        (p) => 
          p.traderAddress.toLowerCase() === swap.user.toLowerCase() &&
          p.inputToken?.toLowerCase() === swap.inputToken.toLowerCase()
      );

      if (copiers.length === 0) {
        // Optional: Log when a trade happens but no permissions exist for this token
        const anyTraderPermissions = activePermissions.filter(
          (p) => p.traderAddress.toLowerCase() === swap.user.toLowerCase()
        );
        
        if (anyTraderPermissions.length > 0) {
          console.log(`\n💡 Trade detected for tracked trader but different token`);
          console.log(`   Trader: ${swap.user.slice(0, 10)}...`);
          console.log(`   Token: ${swap.inputToken.slice(0, 10)}... (no permission)`);
          console.log(`   User has permissions for: ${anyTraderPermissions.map(p => p.inputToken ? p.inputToken.slice(0, 6) + '...' : 'unknown').join(', ')}`);
        }
        continue;
      }

      console.log(`\n🎯 New Master Trade Detected!`);
      console.log(`   Trader: ${swap.user.slice(0, 10)}...`);
      console.log(`   Token: ${swap.inputToken.slice(0, 10)}...`);
      console.log(`   Copiers: ${copiers.length}`);

      // 4. Execute for each copier
      for (const permission of copiers) {
        try {
          // A. Check Expiry - ✅ Use expiresAt (Date) instead of expiry
          if (permission.expiresAt && new Date() > new Date(permission.expiresAt)) {
            console.log(`   ⏰ Permission expired for ${permission.userWallet.slice(0, 8)}...`);
            await CopyTradePermission.findByIdAndUpdate(permission._id, { isActive: false });
            continue;
          }

          // B. Check & Reset Daily Limits
          const dailyLimit = parseFloat(permission.dailyLimit);
          let spentToday = parseFloat(permission.spentToday || "0");

          const now = new Date();
          const lastReset = permission.lastResetAt ? new Date(permission.lastResetAt) : new Date(0);
          const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceReset >= 24) {
            console.log(`   🔄 Resetting daily limit for ${permission.userWallet.slice(0, 8)}...`);
            spentToday = 0;
            await CopyTradePermission.findByIdAndUpdate(permission._id, {
              spentToday: "0",
              lastResetAt: now,
            });
          }

          // C. Calculate Copy Amount
          const amountInHuman = parseFloat(formatUnits(BigInt(swap.inputAmount), 18));
          const copyAmount = amountInHuman * 0.1; // Copy 10% size

          // Validate Limit
          if (spentToday + copyAmount > dailyLimit) {
            console.log(`   💰 Daily limit hit for ${permission.userWallet.slice(0, 8)}...`);
            console.log(`      Spent: ${spentToday.toFixed(4)}, Limit: ${dailyLimit}, Attempted: ${copyAmount.toFixed(4)}`);
            continue;
          }

          // D. Execute Trade
          console.log(`   ⚡ Executing copy for ${permission.userWallet.slice(0, 8)}...`);
          console.log(`      Amount: ${copyAmount.toFixed(4)} (${((copyAmount / dailyLimit) * 100).toFixed(1)}% of daily limit)`);
          
          const userOpHash = await executeCopyTrade({
            permission: {
              userWallet: permission.userWallet,
              sessionAccount: permission.sessionAccount,
              permissionsContext: permission.permissionsContext,
              delegationManager: permission.delegationManager,
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

          console.log(`   ✅ Success! UserOp: ${userOpHash}`);

          // E. Update DB
          const newSpentToday = spentToday + copyAmount;
          await CopyTradePermission.findByIdAndUpdate(permission._id, {
            spentToday: newSpentToday.toString(),
          });
          
          console.log(`   📊 Daily spend updated: ${newSpentToday.toFixed(4)}/${dailyLimit}`);
          
        } catch (error: any) {
          console.error(`   ❌ Execution Failed for ${permission.userWallet.slice(0, 8)}...`);
          console.error(`      Error: ${error.message}`);
        }
      }
    }

    // Cleanup memory
    if (processedSwaps.size > 1000) {
      const arr = Array.from(processedSwaps);
      processedSwaps = new Set(arr.slice(-500));
    }

  } catch (error: any) {
    console.error("Monitor Error:", error.message);
  }
}

/**
 * Start the monitor service
 */
async function startMonitor() {
  console.log("🚀 Copy Trade Monitor Started");
  console.log("   Listening for events on Envio...");
  console.log("   Press Ctrl+C to stop\n");

  // Initial run
  await monitorSwaps();

  // Poll every 10 seconds
  setInterval(monitorSwaps, 10000);
}

// Allow running directly via `ts-node src/services/copyTradeMonitor.ts`
if (require.main === module) {
  startMonitor().catch(console.error);
}

export { monitorSwaps, startMonitor };