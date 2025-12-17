// app/api/copy-trade/enable/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userAddress,
      traderAddress,
      traderUsername,
      inputToken, // ✅ Token address for this permission
      permission,
      dailyLimit,
      sessionAccount,
    } = body;

    console.log("📝 Enable copy trade request:", {
      userAddress,
      traderAddress,
      traderUsername,
      inputToken,
      dailyLimit,
      sessionAccount,
    });

    // Validate required fields
    if (
      !userAddress ||
      !traderAddress ||
      !traderUsername ||
      !inputToken ||
      !permission ||
      !dailyLimit ||
      !sessionAccount
    ) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate permission object
    if (
      !permission.permissionsContext ||
      !permission.delegationManager ||
      !permission.expiry
    ) {
      console.error("❌ Invalid permission object");
      return NextResponse.json(
        { error: "Invalid permission object" },
        { status: 400 }
      );
    }

    await dbConnect();

    // ✅ Convert expiry (Unix timestamp in seconds) to expiresAt (Date)
    const expiresAt = new Date(permission.expiry * 1000);

    console.log("🔄 Upserting permission...");

    // ✅ Use findOneAndUpdate with upsert to prevent duplicates (atomic operation)
    const result = await CopyTradePermission.findOneAndUpdate(
      {
        // Query: Find by unique combination
        userWallet: userAddress.toLowerCase(),
        traderAddress: traderAddress.toLowerCase(),
        inputToken: inputToken.toLowerCase(),
      },
      {
        // Update: Always update these fields
        $set: {
          permissionsContext: permission.permissionsContext,
          delegationManager: permission.delegationManager,
          dailyLimit,
          expiresAt,
          sessionAccount: sessionAccount.toLowerCase(),
          isActive: true,
          traderUsername,
          // Keep existing spentToday and lastResetAt on update
        },
        // Only set these fields when creating new document
        $setOnInsert: {
          spentToday: "0",
          lastResetAt: new Date(),
          createdAt: new Date(),
        },
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    );

    // Check if this was an insert or update
    const wasCreated = result.createdAt && 
      (new Date().getTime() - new Date(result.createdAt).getTime()) < 2000; // Created within last 2 seconds

    const message = wasCreated ? "Copy trade enabled" : "Permission updated";
    console.log(`✅ ${message}:`, result._id);

    return NextResponse.json({
      success: true,
      message,
      permission: result,
    });
  } catch (error: any) {
    console.error("❌ Enable copy trade error:", error);
    
    // Handle duplicate key error (shouldn't happen with upsert, but just in case)
    if (error.code === 11000) {
      console.error("⚠️  Duplicate key error - retrying...");
      return NextResponse.json(
        { error: "Permission already exists, please refresh and try again" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || "Failed to enable copy trade",
        details: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : undefined
      },
      { status: 500 }
    );
  }
}