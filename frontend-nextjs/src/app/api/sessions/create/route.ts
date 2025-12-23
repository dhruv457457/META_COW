// src/app/api/sessions/create/route.ts
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

    // Check if session already exists
    const existingSession = await Session.findOne({
      userAddress: userAddress.toLowerCase(),
    });

    if (existingSession) {
      console.log(`✅ Existing session for ${userAddress}`);
      console.log(`   EOA: ${existingSession.eoaAddress}`);
      console.log(`   Smart Account: ${existingSession.smartAccountAddress}`);
      return NextResponse.json({
        sessionAccount: {
          address: existingSession.smartAccountAddress, // Return smart account address!
        },
      });
    }

    // Generate new private key
    const privateKey = generatePrivateKey();
    const eoaAddress = privateKeyToAddress(privateKey);

    console.log(`📝 Creating session for ${userAddress}`);
    console.log(`   Generated EOA: ${eoaAddress}`);
    console.log(`   Private Key Length: ${privateKey.length}`);

    // Create public client for smart account creation
    const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http("https://data-seed-prebsc-1-s1.binance.org:8545/"),
    });

    // Create signer from private key
    const signer = privateKeyToAccount(privateKey);

    // Create MetaMask Smart Account
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [signer.address, [], [], []],
      deploySalt: "0x",
      signer: { account: signer },
    });

    console.log(`   Smart Account: ${smartAccount.address}`);

    // Save to database
    const newSession = await Session.create({
      userAddress: userAddress.toLowerCase(),
      eoaAddress: eoaAddress.toLowerCase(),
      smartAccountAddress: smartAccount.address.toLowerCase(),
      privateKey,
      createdAt: new Date(),
    });

    console.log(`🎉 Session saved to DB:`);
    console.log(`   ID: ${newSession._id}`);
    console.log(`   User: ${userAddress}`);
    console.log(`   EOA: ${eoaAddress}`);
    console.log(`   Smart Account: ${smartAccount.address}`);

    // Verify
    const verify = await Session.findById(newSession._id);
    console.log(`🔍 Verified - Has private key: ${!!verify?.privateKey}`);

    return NextResponse.json({
      sessionAccount: {
        address: smartAccount.address, // Return smart account address!
      },
    });

  } catch (error: any) {
    console.error("❌ Create session error:", error);
    
    if (error.code === 11000) {
      try {
        const body = await req.clone().json();
        const existingSession = await Session.findOne({
          userAddress: body.userAddress.toLowerCase(),
        });
        
        if (existingSession) {
          return NextResponse.json({
            sessionAccount: {
              address: existingSession.smartAccountAddress,
            },
          });
        }
      } catch (retryError) {
        console.error("Failed to handle duplicate:", retryError);
      }
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}