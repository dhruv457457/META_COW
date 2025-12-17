import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("userAddress");
    const traderAddress = searchParams.get("traderAddress");
    const inputToken = searchParams.get("inputToken");

    if (!userAddress || !traderAddress) {
      return NextResponse.json(
        { error: "Missing userAddress or traderAddress" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Build query
    const query: any = {
      userWallet: userAddress.toLowerCase(),
      traderAddress: traderAddress.toLowerCase(),
      isActive: true,
    };

    // ✅ If inputToken provided, check for that specific token
    if (inputToken) {
      query.inputToken = inputToken.toLowerCase();
    }

    const permission = await CopyTradePermission.findOne(query);

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
