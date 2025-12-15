// src/app/api/copy-trade/enable/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

export async function POST(req: NextRequest) {
  try {
    const {
      userAddress,
      traderAddress,
      traderUsername,
      permission,
      dailyLimit,
      sessionAccount,
    } = await req.json();

    // Validation
    if (!userAddress || !traderAddress || !permission || !dailyLimit || !sessionAccount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user is already copying this trader
    const existingPermission = await CopyTradePermission.findOne({
      userWallet: userAddress.toLowerCase(),
      traderAddress: traderAddress.toLowerCase(),
      isActive: true,
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: "Already copying this trader" },
        { status: 400 }
      );
    }

    // Create permission document
    const newPermission = await CopyTradePermission.create({
      userWallet: userAddress.toLowerCase(),
      traderAddress: traderAddress.toLowerCase(),
      traderUsername,
      sessionAccount: sessionAccount.toLowerCase(),
      permissionsContext: permission.permissionsContext,
      delegationManager: permission.delegationManager.toLowerCase(),
      dailyLimit,
      spentToday: "0",
      lastResetAt: new Date(),
      expiresAt: new Date(permission.expiry * 1000), // Convert to milliseconds
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      permission: newPermission,
    });
  } catch (error: any) {
    console.error("Enable copy trade error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enable copy trading" },
      { status: 500 }
    );
  }
}