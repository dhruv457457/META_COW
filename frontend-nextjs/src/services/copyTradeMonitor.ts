// src/services/copyTradeMonitor-production.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { fetchLatestSwaps } from "@/utils/envioClient";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";
import { executeCopyTrade } from "./tradeExecutor";
import { formatUnits } from "viem";

let processedSwaps = new Set<string>();

// ✅ Production: Performance metrics
const metrics = {
  totalSwapsProcessed: 0,
  totalTradesExecuted: 0,
  totalTradesFailed: 0,
  lastRunTime: 0,
  errors: [] as { timestamp: Date; error: string; user?: string }[],
};

/**
 * Monitor for new swaps and execute copy trades
 * ✅ Production-ready: Handles multiple users, parallel execution, error isolation
 */
async function monitorSwaps() {
  const startTime = Date.now();
  
  try {
    await dbConnect();

    // 1. Fetch latest swaps from Envio
    const swaps = await fetchLatestSwaps(20);
    
    // 2. Get all active permissions (ALL USERS)
    // ✅ Production: Uses index for fast lookup
    const activePermissions = await CopyTradePermission.find({ 
      isActive: true 
    }).lean(); // ✅ Use lean() for better performance

    if (activePermissions.length === 0) {
      metrics.lastRunTime = Date.now() - startTime;
      return;
    }

    console.log(`📊 Monitoring: ${activePermissions.length} active permissions`);

    // 3. Process swaps in parallel (for better performance)
    const swapPromises = swaps.map(async (swap) => {
      const swapId = `${swap.txHash}-${swap.timestamp}`;
      
      // Skip if already processed
      if (processedSwaps.has(swapId)) return;
      
      // Add to processed set
      processedSwaps.add(swapId);
      metrics.totalSwapsProcessed++;
      
      // ✅ Find copiers for this specific trader AND token
      const copiers = activePermissions.filter(
        (p) => 
          p.traderAddress.toLowerCase() === swap.user.toLowerCase() &&
          p.inputToken?.toLowerCase() === swap.inputToken.toLowerCase()
      );

      if (copiers.length === 0) {
        // Optional: Log skipped tokens (commented out to reduce noise)
        // const anyTraderPermissions = activePermissions.filter(
        //   (p) => p.traderAddress.toLowerCase() === swap.user.toLowerCase()
        // );
        // if (anyTraderPermissions.length > 0) {
        //   console.log(`💡 Trade skipped: Different token`);
        // }
        return;
      }

      console.log(`\n🎯 New Master Trade Detected!`);
      console.log(`   Trader: ${swap.user.slice(0, 10)}...`);
      console.log(`   Token: ${swap.inputToken.slice(0, 10)}...`);
      console.log(`   Copiers: ${copiers.length}`);

      // 4. Execute for each copier IN PARALLEL
      // ✅ Production: Parallel execution for better performance
      const copyPromises = copiers.map(async (permission) => {
        try {
          // A. Check Expiry
          if (permission.expiresAt && new Date() > new Date(permission.expiresAt)) {
            console.log(`   ⏰ Permission expired for ${permission.userWallet.slice(0, 8)}...`);
            await CopyTradePermission.findByIdAndUpdate(permission._id, { isActive: false });
            return;
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
            console.log(`      Spent: ${spentToday.toFixed(4)}, Limit: ${dailyLimit}`);
            return;
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
          metrics.totalTradesExecuted++;

          // E. Update DB
          const newSpentToday = spentToday + copyAmount;
          await CopyTradePermission.findByIdAndUpdate(permission._id, {
            spentToday: newSpentToday.toString(),
          });
          
          console.log(`   📊 Daily spend updated: ${newSpentToday.toFixed(4)}/${dailyLimit}`);
          
        } catch (error: any) {
          console.error(`   ❌ Execution Failed for ${permission.userWallet.slice(0, 8)}...`);
          console.error(`      Error: ${error.message}`);
          
          metrics.totalTradesFailed++;
          metrics.errors.push({
            timestamp: new Date(),
            error: error.message,
            user: permission.userWallet,
          });

          // ✅ Production: Keep only last 100 errors
          if (metrics.errors.length > 100) {
            metrics.errors = metrics.errors.slice(-100);
          }
        }
      });

      // Wait for all copy trades for this swap to complete
      await Promise.allSettled(copyPromises);
    });

    // Wait for all swaps to be processed
    await Promise.allSettled(swapPromises);

    // Cleanup memory
    if (processedSwaps.size > 1000) {
      const arr = Array.from(processedSwaps);
      processedSwaps = new Set(arr.slice(-500));
    }

  } catch (error: any) {
    console.error("❌ Monitor Error:", error.message);
    metrics.errors.push({
      timestamp: new Date(),
      error: `Monitor error: ${error.message}`,
    });
  } finally {
    metrics.lastRunTime = Date.now() - startTime;
  }
}

/**
 * Start the monitor service
 * ✅ Production: Includes health checks and metrics
 */
async function startMonitor() {
  console.log("🚀 Copy Trade Monitor Started (Production Mode)");
  console.log("   Listening for events on Envio...");
  console.log("   Press Ctrl+C to stop\n");

  // Initial run
  await monitorSwaps();

  // Poll every 10 seconds
  const interval = setInterval(monitorSwaps, 10000);

  // ✅ Production: Log metrics every 5 minutes
  const metricsInterval = setInterval(() => {
    console.log("\n📊 === Monitor Metrics (Last 5 min) ===");
    console.log(`   Swaps processed: ${metrics.totalSwapsProcessed}`);
    console.log(`   Trades executed: ${metrics.totalTradesExecuted}`);
    console.log(`   Trades failed: ${metrics.totalTradesFailed}`);
    console.log(`   Success rate: ${
      metrics.totalTradesExecuted + metrics.totalTradesFailed > 0
        ? ((metrics.totalTradesExecuted / (metrics.totalTradesExecuted + metrics.totalTradesFailed)) * 100).toFixed(2)
        : 0
    }%`);
    console.log(`   Last run time: ${metrics.lastRunTime}ms`);
    console.log(`   Recent errors: ${metrics.errors.length}`);
    console.log("=====================================\n");
  }, 300000); // 5 minutes

  // ✅ Production: Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    clearInterval(interval);
    clearInterval(metricsInterval);
    
    console.log('\n📊 Final Metrics:');
    console.log(`   Total swaps processed: ${metrics.totalSwapsProcessed}`);
    console.log(`   Total trades executed: ${metrics.totalTradesExecuted}`);
    console.log(`   Total trades failed: ${metrics.totalTradesFailed}`);
    console.log('\n✅ Monitor stopped\n');
    
    process.exit(0);
  });
}

/**
 * ✅ Production: Health check endpoint
 * Call this from your monitoring service
 */
export function getMonitorHealth() {
  return {
    status: "running",
    metrics: {
      ...metrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  };
}

// Allow running directly
if (require.main === module) {
  startMonitor().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

export { monitorSwaps, startMonitor, metrics };