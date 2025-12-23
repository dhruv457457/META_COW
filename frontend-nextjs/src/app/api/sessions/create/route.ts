import { NextRequest, NextResponse } from "next/server";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";
import { toMetaMaskSmartAccount, Implementation } from "@metamask/smart-accounts-kit";
import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";
import dbConnect from "@/lib/dbConnect";
import Session from "@/models/Session";

export async function POST(req: NextRequest) {
  try {
    const { userAddress } = await req.json();

    if (!userAddress) {
      return NextResponse.json(
        { error: "User address is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if session already exists for this user
    const existingSession = await Session.findOne({
      userAddress: userAddress.toLowerCase(),
    });

    if (existingSession) {
      console.log(`✅ Existing session for ${userAddress}`);
      return NextResponse.json({
        sessionAccount: {
          address: existingSession.smartAccountAddress,
        },
      });
    }

    // Generate new private key for the session
    const privateKey = generatePrivateKey();
    const eoaAddress = privateKeyToAddress(privateKey);

    console.log(`📝 Creating session for ${userAddress}`);

    // Create public client for smart account address calculation
    const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http("https://data-seed-prebsc-1-s1.binance.org:8545/"),
    });

    // Create signer from private key
    const signer = privateKeyToAccount(privateKey);

    // Calculate MetaMask Smart Account Address (Deterministic)
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [signer.address, [], [], []],
      deploySalt: "0x",
      signer: { account: signer },
    });

    console.log(`   Smart Account: ${smartAccount.address}`);

    // Save to database
    // 🔴 FIX: Explicitly set 'address' to match the smart account address
    // This prevents the "dup key: { address: null }" error in MongoDB
    const newSession = await Session.create({
      userAddress: userAddress.toLowerCase(),
      eoaAddress: eoaAddress.toLowerCase(),
      smartAccountAddress: smartAccount.address.toLowerCase(),
      address: smartAccount.address.toLowerCase(), // ✅ Added this critical field
      privateKey,
      isActive: true,
      createdAt: new Date(),
    });

    console.log(`🎉 Session saved to DB: ${newSession._id}`);

    return NextResponse.json({
      sessionAccount: {
        address: smartAccount.address,
      },
    });

  } catch (error: any) {
    console.error("❌ Create session error:", error);
    
    // Handle race conditions (duplicate key error) gracefully
    if (error.code === 11000) {
      try {
        const body = await req.clone().json();
        const existing = await Session.findOne({ userAddress: body.userAddress.toLowerCase() });
        if (existing) {
          return NextResponse.json({
            sessionAccount: { address: existing.smartAccountAddress },
          });
        }
      } catch (e) {
        console.error("Retry failed:", e);
      }
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}