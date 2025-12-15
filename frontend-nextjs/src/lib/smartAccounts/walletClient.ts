// src/lib/smartAccounts/walletClient.ts
import { createWalletClient, custom } from "viem";
import { bscTestnet } from "viem/chains";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";

/**
 * Creates a client-side wallet client for requesting permissions from MetaMask Flask
 * This must be called in the browser where window.ethereum is available
 */
export function createClientWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not available");
  }

  return createWalletClient({
    chain: bscTestnet,
    transport: custom(window.ethereum),
  }).extend(erc7715ProviderActions());
}