// src/services/tradeExecutor.ts
import { bundlerClient, publicClient } from "@/lib/smartAccounts/bundlerClient";
import { encodeFunctionData, parseUnits } from "viem";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";
import CopyTrade from "@/models/CopyTrade";
import { EnvioSwapEvent } from "@/utils/envioClient";
import { getSessionSigner } from "@/lib/smartAccounts/sessionAccount";

// DEX Router ABI - just the swap function
const DEX_ROUTER_ABI = [{
  name: "swap",
  type: "function",
  inputs: [
    { name: "amountIn", type: "uint256" },
    { name: "tokenIn", type: "address" },
  ],
  outputs: [{ name: "amountOut", type: "uint256" }],
}];

interface ExecuteCopyTradeParams {
  permission: any;
  swap: EnvioSwapEvent;
  amount: number;
}

/**
 * Execute a copy trade using Advanced Permissions
 */
export async function executeCopyTrade({
  permission,
  swap,
  amount,
}: ExecuteCopyTradeParams): Promise<string> {
  console.log(`🔄 Executing copy trade for ${permission.userWallet}`);
  console.log(`   Amount: ${amount} USD`);
  console.log(`   Trader: ${swap.user}`);

  try {
    await dbConnect();

    // Get session signer
    const sessionSigner = getSessionSigner();
    console.log(`   Session signer: ${sessionSigner.address}`);

    // Prepare swap calldata
    const amountInWei = parseUnits(amount.toString(), 18);
    
    const swapCalldata = encodeFunctionData({
      abi: DEX_ROUTER_ABI,
      functionName: "swap",
      args: [amountInWei, swap.inputToken as `0x${string}`],
    });

    console.log("   Executing with Advanced Permissions...");

    // REAL execution with Advanced Permissions via bundler
    const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
      publicClient,
      account: sessionSigner,
      calls: [{
        to: process.env.NEXT_PUBLIC_DEX_ROUTER_ADDRESS as `0x${string}`,
        data: swapCalldata,
        value: 0n,
        permissionsContext: permission.permissionsContext,
        delegationManager: permission.delegationManager as `0x${string}`,
      }],
      maxFeePerGas: 3000000000n, // 3 gwei
      maxPriorityFeePerGas: 2000000000n, // 2 gwei
    });

    console.log(`   ✅ User operation hash: ${userOpHash}`);

    // Save to database
    await CopyTrade.create({
      permissionId: permission._id.toString(),
      userOpHash,
      userId: permission.userWallet,
      traderAddress: swap.user,
      inputToken: swap.inputToken,
      outputToken: swap.outputToken,
      amount: amount.toString(),
      originalTxHash: swap.txHash,
      executedAt: new Date(),
    });

    // Update spent amount
    const newSpent = parseFloat(permission.spentToday) + amount;
    await CopyTradePermission.findByIdAndUpdate(permission._id, {
      spentToday: newSpent.toString(),
      lastResetAt: new Date(),
    });

    console.log(`   ✅ Copy trade saved to database`);

    return userOpHash;

  } catch (error: any) {
    console.error("   ❌ Execute copy trade error:", error);
    throw error;
  }
}

/**
 * Get copy trade history for a user
 */
export async function getCopyTradeHistory(
  userWallet: string,
  limit: number = 20
) {
  await dbConnect();
  
  return await CopyTrade.find({
    userId: userWallet.toLowerCase(),
  })
    .sort({ executedAt: -1 })
    .limit(limit);
}

/**
 * Get copy trade statistics for a user
 */
export async function getCopyTradeStats(userWallet: string) {
  await dbConnect();
  
  const trades = await CopyTrade.find({
    userId: userWallet.toLowerCase(),
  });

  const totalTrades = trades.length;
  const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  // Get today's trades
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTrades = trades.filter(t => t.executedAt >= today);
  const todayVolume = todayTrades.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Get active permissions
  const activePermissions = await CopyTradePermission.find({
    userWallet: userWallet.toLowerCase(),
    isActive: true,
  });

  return {
    totalTrades,
    totalVolume,
    todayTrades: todayTrades.length,
    todayVolume,
    activeCopies: activePermissions.length,
  };
}
