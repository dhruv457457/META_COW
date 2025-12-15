// src/app/api/copy-trade/disable/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

export async function POST(req: NextRequest) {
  try {
    const { userAddress, traderAddress } = await req.json();

    if (!userAddress || !traderAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find and deactivate the permission
    const permission = await CopyTradePermission.findOneAndUpdate(
      {
        userWallet: userAddress.toLowerCase(),
        traderAddress: traderAddress.toLowerCase(),
        isActive: true,
      },
      {
        isActive: false,
      },
      { new: true }
    );

    if (!permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Copy trading disabled",
    });
  } catch (error: any) {
    console.error("Disable copy trade error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disable copy trading" },
      { status: 500 }
    );
  }
}