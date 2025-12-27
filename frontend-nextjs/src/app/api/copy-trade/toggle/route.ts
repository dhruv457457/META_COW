import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

export async function POST(req: NextRequest) {
  try {
    const { permissionId, isActive } = await req.json();

    if (!permissionId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    await dbConnect();

    const permission = await CopyTradePermission.findById(permissionId);

    if (!permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    // Update the permission status
    permission.isActive = isActive;
    permission.updatedAt = new Date();
    await permission.save();

    return NextResponse.json({ 
      success: true,
      isActive,
      permission: {
        id: permission._id.toString(),
        traderAddress: permission.traderAddress,
        traderUsername: permission.traderUsername,
        isActive: permission.isActive,
      }
    });
  } catch (error: any) {
    console.error("Toggle permission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle permission" },
      { status: 500 }
    );
  }
}