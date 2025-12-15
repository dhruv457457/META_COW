// src/lib/smartAccounts/bundlerClient.ts
import { createPublicClient, http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { bscTestnet } from "viem/chains";
import { erc7710BundlerActions } from "@metamask/smart-accounts-kit/actions";

/**
 * Public client for reading blockchain state
 */
export const publicClient = createPublicClient({
  chain: bscTestnet,
transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
});

/**
 * Bundler client for executing user operations with Advanced Permissions
 * This client can send transactions on behalf of users using granted delegations
 */
export const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(process.env.BUNDLER_RPC!),
  paymaster: true, // Enable gas sponsorship
}).extend(erc7710BundlerActions());