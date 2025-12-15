// src/app/api/sessions/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Session from "@/models/Session";
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

    await dbConnect();

    // Check if session already exists for this user
    const existingSession = await Session.findOne({
      userAddress: userAddress.toLowerCase(),
    });

    if (existingSession) {
      return NextResponse.json({
        sessionAccount: {
          address: existingSession.address,
        },
        message: "Session already exists",
      });
    }

    // Create new session account
    const { address } = await createSessionAccount();

    // Save to database
    const session = await Session.create({
      userAddress: userAddress.toLowerCase(),
      address: address.toLowerCase(),
    });

    return NextResponse.json({
      sessionAccount: {
        address: session.address,
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