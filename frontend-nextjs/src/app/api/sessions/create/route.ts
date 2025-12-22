// src/app/api/sessions/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSessionAccount } from "@/lib/smartAccounts/sessionAccount";

export async function POST(req: NextRequest) {
  try {
    const { userAddress } = await req.json();

    if (!userAddress) {
      return NextResponse.json(
        { error: "User address is required" },
        { status: 400 }
      );
    }

    // ✅ Just return the shared session account
    // No database needed - it's the same for everyone!
    const { address } = await createSessionAccount();

    console.log(`Session account for user ${userAddress}: ${address}`);

    return NextResponse.json({
      sessionAccount: {
        address: address,
      },
    });

  } catch (error: any) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}