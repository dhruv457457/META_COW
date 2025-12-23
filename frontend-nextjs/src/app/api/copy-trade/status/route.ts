// src/app/api/copy-trade/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

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

    // Check for active permission
    const permission = await CopyTradePermission.findOne({
      userWallet: userAddress.toLowerCase(), // This might be smart account OR EOA
      traderAddress: traderAddress.toLowerCase(),
      inputToken: inputToken.toLowerCase(),
      isActive: true,
    });

    // Also check if there's a permission with a different userWallet
    // (In case user is checking with EOA but permission is saved with smart account)
    const anyPermission = await CopyTradePermission.findOne({
      traderAddress: traderAddress.toLowerCase(),
      inputToken: inputToken.toLowerCase(),
      isActive: true,
    });

    return NextResponse.json({
      isEnabled: !!permission || !!anyPermission,
      permission: permission || anyPermission || null,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}