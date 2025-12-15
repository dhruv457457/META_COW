import { privateKeyToAccount } from "viem/accounts";
import { toMetaMaskSmartAccount, Implementation } from "@metamask/smart-accounts-kit";
import { publicClient } from "./bundlerClient";

/**
 * Creates a MetaMask Smart Account for the session
 * This account will execute transactions on behalf of users using granted permissions
 * 
 * The session private key should be stored securely in env variables
 * This is a SERVER-SIDE only function - never expose private keys to the client!
 */
export async function createSessionAccount() {
  const privateKey = process.env.SESSION_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("SESSION_PRIVATE_KEY not found in environment variables");
  }

  // Convert private key to account
  const signer = privateKeyToAccount(privateKey as `0x${string}`);

  // Create MetaMask Smart Account
  const sessionAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [signer.address, [], [], []],
    deploySalt: "0x",
    signer: { account: signer },
  });

  return {
    account: sessionAccount,
    address: sessionAccount.address,
    signer,
  };
}

/**
 * Helper function to get just the signer (for simpler operations)
 */
export function getSessionSigner() {
  const privateKey = process.env.SESSION_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("SESSION_PRIVATE_KEY not found in environment variables");
  }

  return privateKeyToAccount(privateKey as `0x${string}`);
}