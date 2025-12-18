// src/lib/smartAccounts/bundlerClient.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createPublicClient, http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { bscTestnet } from "viem/chains";
import { erc7710BundlerActions } from "@metamask/smart-accounts-kit/actions";

// Get bundler URL with validation
const bundlerUrl = process.env.BUNDLER_RPC || process.env.BUNDLER_URL;

if (!bundlerUrl) {
  throw new Error(
    "BUNDLER_RPC or BUNDLER_URL environment variable is required. " +
    "Please set it to your Pimlico bundler URL."
  );
}

console.log(`🔗 Using Bundler: ${bundlerUrl.substring(0, 40)}...`);

/**
 * Public client for reading blockchain state
 */
export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(
    process.env.NEXT_PUBLIC_RPC_URL || 
    process.env.BSC_TESTNET_RPC || 
    "https://bsc-testnet-rpc.publicnode.com"
  ),
});

/**
 * Bundler client for executing user operations with Advanced Permissions
 */
export const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(bundlerUrl),
  paymaster: true,
}).extend(erc7710BundlerActions());