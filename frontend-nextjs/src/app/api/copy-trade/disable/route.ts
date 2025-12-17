import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAddress, traderAddress, inputToken } = body;

    if (!userAddress || !traderAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Build query
    const query: any = {
      userWallet: userAddress.toLowerCase(),
      traderAddress: traderAddress.toLowerCase(),
    };

    // ✅ If inputToken provided, disable only that specific permission
    if (inputToken) {
      query.inputToken = inputToken.toLowerCase();
    }

    const result = await CopyTradePermission.updateMany(query, {
      isActive: false,
    });

    return NextResponse.json({
      success: true,
      message: inputToken
        ? "Copy trade disabled for specific token"
        : "Copy trade disabled for all tokens",
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Disable copy trade error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disable copy trade" },
      { status: 500 }
    );
  }
}