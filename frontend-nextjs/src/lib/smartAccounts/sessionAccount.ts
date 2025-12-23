// src/lib/smartAccounts/sessionAccount.ts
import { privateKeyToAccount } from "viem/accounts";
import { toMetaMaskSmartAccount, Implementation } from "@metamask/smart-accounts-kit";
import { publicClient } from "./bundlerClient";
import dbConnect from "../dbConnect";
import Session from "../../models/Session";

/**
 * Creates MetaMask Smart Account from stored session
 * Looks up session by SMART ACCOUNT address and uses stored private key
 */
export async function createSessionAccountFromAddress(smartAccountAddress: string) {
  await dbConnect();
  
  // Look up session by smart account address
  const session = await Session.findOne({
    smartAccountAddress: smartAccountAddress.toLowerCase(),
  });

  if (!session || !session.privateKey) {
    throw new Error(`Session not found for smart account: ${smartAccountAddress}`);
  }

  console.log(`📂 Loading session:`);
  console.log(`   Smart Account: ${session.smartAccountAddress}`);
  console.log(`   EOA: ${session.eoaAddress}`);

  // Create signer from private key
  const signer = privateKeyToAccount(session.privateKey as `0x${string}`);

  // Recreate the same MetaMask Smart Account
  const sessionAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [signer.address, [], [], []],
    deploySalt: "0x",
    signer: { account: signer },
  });

  console.log(`✅ Recreated smart account: ${sessionAccount.address}`);

  // Verify addresses match
  if (sessionAccount.address.toLowerCase() !== session.smartAccountAddress.toLowerCase()) {
    throw new Error(
      `Smart account address mismatch! ` +
      `Expected: ${session.smartAccountAddress}, ` +
      `Got: ${sessionAccount.address}`
    );
  }

  return {
    account: sessionAccount,
    address: sessionAccount.address,
    signer,
  };
}

// Keep legacy function for backward compatibility
export async function createSessionAccount() {
  const privateKey = process.env.SESSION_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("SESSION_PRIVATE_KEY not found");
  }

  const signer = privateKeyToAccount(privateKey as `0x${string}`);

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

export function getSessionSigner() {
  const privateKey = process.env.SESSION_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("SESSION_PRIVATE_KEY not found");
  }

  return privateKeyToAccount(privateKey as `0x${string}`);
}