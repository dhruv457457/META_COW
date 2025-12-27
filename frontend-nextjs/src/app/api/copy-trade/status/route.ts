// src/app/api/copy-trade/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";
import Session from "@/models/Session";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("userAddress");
    const traderAddress = searchParams.get("traderAddress");
    const inputToken = searchParams.get("inputToken");

    if (!userAddress || !traderAddress || !inputToken) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await dbConnect();

    const userLower = userAddress.toLowerCase();
    const traderLower = traderAddress.toLowerCase();
    const tokenLower = inputToken.toLowerCase();

    // ✅ Check if this is an EOA that has a smart account
    // If so, we need to check using the smart account address
    const session = await Session.findOne({ userAddress: userLower });
    
    // Build an array of possible wallet addresses to check
    const walletsToCheck = [userLower];
    
    if (session?.smartAccountAddress) {
      walletsToCheck.push(session.smartAccountAddress.toLowerCase());
    }

    console.log(`🔍 Checking status for wallets:`, walletsToCheck);

    // ✅ FIXED: Check for THIS user's permission (either their EOA or smart account)
    const permission = await CopyTradePermission.findOne({
      userWallet: { $in: walletsToCheck },
      traderAddress: traderLower,
      inputToken: tokenLower,
      isActive: true,
    });

    console.log(`✅ Permission found:`, !!permission);

    return NextResponse.json({
      isEnabled: !!permission,
      permission: permission || null,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}