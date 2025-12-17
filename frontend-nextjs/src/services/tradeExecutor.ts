// src/services/tradeExecutor.ts
import { bundlerClient, publicClient } from "@/lib/smartAccounts/bundlerClient";
import { encodeFunctionData, parseUnits } from "viem";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";
import CopyTrade from "@/models/CopyTrade";
import { createSessionAccount } from "@/lib/smartAccounts/sessionAccount";

const ERC20_ABI = [
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const FACTORY_ABI = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
    ],
    name: "getPair",
    outputs: [{ name: "pair", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const PAIR_ABI = [
  {
    name: "swap",
    type: "function",
    inputs: [
      { name: "inputAmount", type: "uint256" },
      { name: "inputToken", type: "address" },
    ],
    outputs: [{ name: "outputAmount", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    name: "getAmountOut",
    type: "function",
    inputs: [
      { name: "inputAmount", type: "uint256" },
      { name: "inputToken", type: "address" },
    ],
    outputs: [{ name: "outputAmount", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

interface SwapData {
  user: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  txHash: string;
}

interface PermissionData {
  userWallet: string;
  sessionAccount: string;
  permissionsContext: string;
  delegationManager: string;
  _id: any;
}

interface ExecuteCopyTradeParams {
  permission: PermissionData;
  swap: SwapData;
  amount: number;
}

export async function executeCopyTrade({
  permission,
  swap,
  amount,
}: ExecuteCopyTradeParams): Promise<string> {
  console.log(`🔄 Executing copy trade for ${permission.userWallet}`);
  console.log(`   Amount: ${amount} tokens`);

  try {
    await dbConnect();

    const { account: sessionAccount } = await createSessionAccount();
    console.log(`   Session: ${sessionAccount.address}`);

    const inputToken = swap.inputToken as `0x${string}`;
    const outputToken = swap.outputToken as `0x${string}`;
    const user = permission.userWallet as `0x${string}`;
    const factory = process.env.NEXT_PUBLIC_DEX_ROUTER_ADDRESS as `0x${string}`;

    // Get pair
    const pair = await publicClient.readContract({
      address: factory,
      abi: FACTORY_ABI,
      functionName: "getPair",
      args: [inputToken, outputToken],
    });

    console.log(`   Pair: ${pair}`);

    const amountIn = parseUnits(amount.toString(), 18);

    // Get expected output
    let amountOut: bigint;
    try {
      amountOut = await publicClient.readContract({
        address: pair,
        abi: PAIR_ABI,
        functionName: "getAmountOut",
        args: [amountIn, inputToken],
      });
    } catch {
      amountOut = (amountIn * 90n) / 100n;
    }

    console.log(`   Building 4-step multi-call (NO delegation)...`);

    // NO permissionsContext or delegationManager!
    // Just normal ERC-4337 calls
    const calls = [
      // Step 1: Pull tokens from user
      {
        to: inputToken,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transferFrom",
          args: [user, sessionAccount.address, amountIn],
        }),
        value: 0n,
      },
      // Step 2: Approve pair
      {
        to: inputToken,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [pair, amountIn],
        }),
        value: 0n,
      },
      // Step 3: Swap
      {
        to: pair,
        data: encodeFunctionData({
          abi: PAIR_ABI,
          functionName: "swap",
          args: [amountIn, inputToken],
        }),
        value: 0n,
      },
      // Step 4: Send output to user
      {
        to: outputToken,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [user, amountOut],
        }),
        value: 0n,
      },
    ];

    console.log(`   Sending UserOp...`);

    // Normal sendUserOperation (not sendUserOperationWithDelegation)
    const userOpHash = await bundlerClient.sendUserOperation({
      account: sessionAccount,
      calls,
      maxFeePerGas: 3000000000n,
      maxPriorityFeePerGas: 2000000000n,
    });

    console.log(`   ✅ UserOp: ${userOpHash}`);

    let txHash: string | undefined;
    try {
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });
      txHash = receipt.receipt.transactionHash;
      console.log(`   ✅ TX: ${txHash}`);
      console.log(`   🔗 https://testnet.bscscan.com/tx/${txHash}`);
    } catch {}

    try {
      await CopyTrade.create({
        permissionId: permission._id.toString(),
        userOpHash,
        transactionHash: txHash,
        userId: permission.userWallet,
        traderAddress: swap.user,
        inputToken,
        outputToken,
        amount: amountIn.toString(),
        originalTxHash: swap.txHash,
      });
      console.log(`   ✅ Saved`);
    } catch (e: any) {
      if (e.code !== 11000) throw e;
    }

    return userOpHash;
  } catch (error: any) {
    console.error("   ❌ Error:", error);
    throw error;
  }
}

export async function getCopyTradeHistory(userWallet: string, limit: number = 20) {
  await dbConnect();
  return await CopyTrade.find({ userId: userWallet.toLowerCase() })
    .sort({ executedAt: -1 })
    .limit(limit);
}

export async function getCopyTradeStats(userWallet: string) {
  await dbConnect();
  const trades = await CopyTrade.find({ userId: userWallet.toLowerCase() });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTrades = trades.filter(t => t.executedAt >= today);
  const activePermissions = await CopyTradePermission.find({
    userWallet: userWallet.toLowerCase(),
    isActive: true,
  });

  return {
    totalTrades: trades.length,
    totalVolume: trades.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    todayTrades: todayTrades.length,
    todayVolume: todayTrades.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    activeCopies: activePermissions.length,
  };
}