// src/app/api/copy-trade/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("userAddress");
    const traderAddress = searchParams.get("traderAddress");

    if (!userAddress || !traderAddress) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find active permission
    const permission = await CopyTradePermission.findOne({
      userWallet: userAddress.toLowerCase(),
      traderAddress: traderAddress.toLowerCase(),
      isActive: true,
    });

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