// src/services/tradeExecutor.ts (Memory optimized with pair validation + nonce management)
import { bundlerClient, publicClient } from "../lib/smartAccounts/bundlerClient";
import { encodeFunctionData, parseUnits, type Address } from "viem";
import dbConnect from "../lib/dbConnect";
import CopyTradePermission from "../models/CopyTradePermission";
import CopyTrade from "../models/CopyTrade";
import { createSessionAccountFromAddress } from "../lib/smartAccounts/sessionAccount";

// --- Constants ---

const ENTRYPOINT_ADDRESS_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const;

// --- ABIs ---

const ERC20_ABI = [
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
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
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
      { name: "amountIn", type: "uint256" },
      { name: "inputToken", type: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

// --- Interfaces ---

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

interface DelegationCall {
  to: Address;
  data: `0x${string}`;
  permissionsContext: `0x${string}`;
  delegationManager: Address;
}

// --- Helper Functions ---

function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function toAddress(address: string): Address {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return address;
}

/**
 * ✅ Get current nonce for smart account from EntryPoint
 */
async function getNonceForAccount(address: Address, entryPoint: Address): Promise<bigint> {
  try {
    const nonce = await publicClient.readContract({
      address: entryPoint,
      abi: [
        {
          inputs: [
            { name: "sender", type: "address" },
            { name: "key", type: "uint192" }
          ],
          name: "getNonce",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        }
      ],
      functionName: "getNonce",
      args: [address, 0n], // key = 0 for default nonce sequence
    });
    return nonce as bigint;
  } catch (error) {
    console.warn("   ⚠️ Could not fetch nonce from EntryPoint, using default 0");
    return 0n;
  }
}

// --- Main Function ---

export async function executeCopyTrade({
  permission,
  swap,
  amount,
}: ExecuteCopyTradeParams): Promise<string> {
  console.log(`🔄 Executing ERC-7715 Copy Trade for ${permission.userWallet}`);
  console.log(`   Amount: ${amount} tokens`);

  try {
    await dbConnect();

    // ✅ 1. Get THIS USER'S specific session account from database
    const { account: sessionAccount } = await createSessionAccountFromAddress(
      permission.sessionAccount
    );
    
    console.log(`   Acting as Session: ${sessionAccount.address}`);

    // Validate addresses
    const inputToken = toAddress(swap.inputToken);
    const outputToken = toAddress(swap.outputToken);
    const userWallet = toAddress(permission.userWallet);
    
    const factoryAddress = process.env.NEXT_PUBLIC_DEX_ROUTER_ADDRESS;
    if (!factoryAddress || !isValidAddress(factoryAddress)) {
      throw new Error("Invalid or missing DEX_ROUTER_ADDRESS in environment");
    }
    const factory = factoryAddress as Address;

    // 2. Get Liquidity Pair Address with error handling
    let pair: Address;
    try {
      pair = await publicClient.readContract({
        address: factory,
        abi: FACTORY_ABI,
        functionName: "getPair",
        args: [inputToken, outputToken],
      });

      if (!pair || pair === "0x0000000000000000000000000000000000000000") {
        console.warn(`   ⚠️  Liquidity pair does not exist for this token combination`);
        console.warn(`      Input: ${inputToken.slice(0, 10)}...`);
        console.warn(`      Output: ${outputToken.slice(0, 10)}...`);
        console.warn(`      Skipping trade...`);
        throw new Error("PAIR_NOT_FOUND");
      }
    } catch (error: any) {
      if (error.message === "PAIR_NOT_FOUND") {
        throw error;
      }
      console.warn(`   ⚠️  Liquidity pair does not exist (contract reverted)`);
      console.warn(`      Input: ${inputToken.slice(0, 10)}...`);
      console.warn(`      Output: ${outputToken.slice(0, 10)}...`);
      console.warn(`      Skipping trade...`);
      throw new Error("PAIR_NOT_FOUND");
    }

    console.log(`   Target Pair: ${pair}`);

    // 3. Calculate Amounts
    const amountIn = parseUnits(amount.toString(), 18);

    console.log(`   📋 4-Step Architecture:`);
    console.log(`      1️⃣  Transfer tokens: User → Session (delegated)`);
    console.log(`      2️⃣  Approve pair: Session owns tokens`);
    console.log(`      3️⃣  Execute swap: Session swaps`);
    console.log(`      4️⃣  Return tokens: Session → User`);

    const entryPointAddress = (
      process.env.ENTRYPOINT_ADDRESS || 
      process.env.NEXT_PUBLIC_ENTRYPOINT_ADDRESS || 
      ENTRYPOINT_ADDRESS_V07
    ) as Address;

    // --- STEP 1: Transfer tokens from user to session (DELEGATED) ---
    const transferCallData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [sessionAccount.address as Address, amountIn],
    });

    const delegationManager = toAddress(permission.delegationManager);
    const permissionsContext = permission.permissionsContext as `0x${string}`;

    const delegatedTransferCall: DelegationCall = {
      to: inputToken,
      data: transferCallData,
      permissionsContext,
      delegationManager,
    };

    console.log(`   1️⃣  Delegated transfer (user → session)...`);

    // ✅ Fetch current nonce for transfer
    const transferNonce = await getNonceForAccount(sessionAccount.address, entryPointAddress);
    console.log(`   🔢 Current nonce for transfer: ${transferNonce}`);

    const transferUserOpHash = await bundlerClient.sendUserOperationWithDelegation({
      account: sessionAccount,
      calls: [delegatedTransferCall],
      publicClient,
      entryPointAddress,
      nonce: transferNonce, // ✅ Explicitly set nonce
      maxFeePerGas: 3000000000n,
      maxPriorityFeePerGas: 2000000000n,
    });

    console.log(`   ✅ Transfer UserOp: ${transferUserOpHash}`);

    try {
      const transferReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash: transferUserOpHash,
      });
      console.log(`   ✅ Transfer confirmed: ${transferReceipt.receipt.transactionHash}`);
    } catch (e) {
      console.warn("   ⚠️ Transfer receipt wait timed out");
    }

    // Small delay to ensure transfer is processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // --- STEP 2 & 3: Approve and Swap ---
    console.log(`   2️⃣ 3️⃣  Session executing approve + swap...`);

    const approveCallData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [pair, amountIn],
    });

    const swapCallData = encodeFunctionData({
      abi: PAIR_ABI,
      functionName: "swap",
      args: [amountIn, inputToken],
    });

    // ✅ Fetch current nonce for swap
    const swapNonce = await getNonceForAccount(sessionAccount.address, entryPointAddress);
    console.log(`   🔢 Current nonce for swap: ${swapNonce}`);

    const swapUserOpHash = await bundlerClient.sendUserOperation({
      account: sessionAccount,
      calls: [
        { to: inputToken, data: approveCallData },
        { to: pair, data: swapCallData },
      ],
      entryPointAddress,
      nonce: swapNonce, // ✅ Explicitly set nonce
      maxFeePerGas: 3000000000n,
      maxPriorityFeePerGas: 2000000000n,
    });

    console.log(`   ✅ Swap UserOp: ${swapUserOpHash}`);

    let swapTxHash: string | undefined;
    try {
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: swapUserOpHash,
      });
      swapTxHash = receipt.receipt.transactionHash;
      console.log(`   ✅ Swap confirmed: ${swapTxHash}`);
    } catch (e) {
      console.warn("   ⚠️ Swap receipt wait timed out");
    }

    // Small delay to ensure swap is processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // --- STEP 4: Transfer output tokens back to user ---
    console.log(`   4️⃣  Returning output tokens to user...`);

    try {
      const outputBalance = await publicClient.readContract({
        address: outputToken,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [sessionAccount.address],
      });

      console.log(`   Session output balance: ${outputBalance.toString()}`);

      if (outputBalance > 0n) {
        const returnCallData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [userWallet, outputBalance],
        });

        // ✅ Fetch current nonce for return
        const returnNonce = await getNonceForAccount(sessionAccount.address, entryPointAddress);
        console.log(`   🔢 Current nonce for return: ${returnNonce}`);

        const returnUserOpHash = await bundlerClient.sendUserOperation({
          account: sessionAccount,
          calls: [{ to: outputToken, data: returnCallData }],
          entryPointAddress,
          nonce: returnNonce, // ✅ Explicitly set nonce
          maxFeePerGas: 3000000000n,
          maxPriorityFeePerGas: 2000000000n,
        });

        console.log(`   ✅ Return UserOp: ${returnUserOpHash}`);

        try {
          const returnReceipt = await bundlerClient.waitForUserOperationReceipt({
            hash: returnUserOpHash,
          });
          console.log(`   ✅ Return confirmed: ${returnReceipt.receipt.transactionHash}`);
          console.log(`   🎉 User received ${outputBalance.toString()} output tokens!`);
        } catch (e) {
          console.warn("   ⚠️ Return receipt wait timed out");
        }
      } else {
        console.warn("   ⚠️ No output tokens to return (swap may have failed)");
      }
    } catch (e) {
      console.error("   ❌ Failed to return output tokens:", e);
    }

    console.log(`   🔗 https://testnet.bscscan.com/tx/${swapTxHash || transferUserOpHash}`);

    // Save trade record
    try {
      await CopyTrade.create({
        permissionId: permission._id.toString(),
        userOpHash: swapUserOpHash,
        transactionHash: swapTxHash || "pending",
        userId: permission.userWallet,
        traderAddress: swap.user,
        inputToken: inputToken,
        outputToken: outputToken,
        amount: amountIn.toString(),
        originalTxHash: swap.txHash,
      });
      console.log(`   ✅ Trade saved to DB`);
    } catch (e: any) {
      if (e.code !== 11000) {
        console.error("DB Save Error:", e);
      }
    }

    return swapUserOpHash;
  } catch (error: any) {
    console.error("   ❌ Execution Error:", error);
    console.error("   Error details:", {
      message: error.message,
      code: error.code,
      data: error.data,
    });
    throw error;
  }
}

export async function getCopyTradeHistory(userWallet: string, limit: number = 20) {
  try {
    await dbConnect();
    
    if (!userWallet || !isValidAddress(userWallet)) {
      throw new Error("Invalid user wallet address");
    }

    return await CopyTrade.find({ userId: userWallet.toLowerCase() })
      .sort({ executedAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("Error fetching copy trade history:", error);
    throw error;
  }
}

export async function getCopyTradeStats(userWallet: string) {
  try {
    await dbConnect();
    
    if (!userWallet || !isValidAddress(userWallet)) {
      throw new Error("Invalid user wallet address");
    }

    const walletLower = userWallet.toLowerCase();
    const trades = await CopyTrade.find({ userId: walletLower }).lean();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = trades.filter((t) => {
      const tradeDate = new Date(t.executedAt);
      return tradeDate >= today;
    });

    const activePermissions = await CopyTradePermission.find({
      userWallet: walletLower,
      isActive: true,
    }).lean();

    return {
      totalTrades: trades.length,
      totalVolume: trades.reduce((sum, t) => {
        try {
          return sum + parseFloat(t.amount || "0");
        } catch {
          return sum;
        }
      }, 0),
      todayTrades: todayTrades.length,
      todayVolume: todayTrades.reduce((sum, t) => {
        try {
          return sum + parseFloat(t.amount || "0");
        } catch {
          return sum;
        }
      }, 0),
      activeCopies: activePermissions.length,
    };
  } catch (error) {
    console.error("Error fetching copy trade stats:", error);
    throw error;
  }
}