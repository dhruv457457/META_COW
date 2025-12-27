import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CopyTradePermission from "@/models/CopyTradePermission";

export async function POST(req: NextRequest) {
  try {
    const { permissionId } = await req.json();

    if (!permissionId) {
      return NextResponse.json(
        { error: "Permission ID required" },
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

    // Store permission details before deletion for response
    const deletedPermission = {
      id: permission._id.toString(),
      traderAddress: permission.traderAddress,
      traderUsername: permission.traderUsername,
      inputToken: permission.inputToken,
    };

    // Delete the permission
    await CopyTradePermission.findByIdAndDelete(permissionId);

    return NextResponse.json({ 
      success: true,
      deleted: true,
      permission: deletedPermission
    });
  } catch (error: any) {
    console.error("Delete permission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete permission" },
      { status: 500 }
    );
  }
}