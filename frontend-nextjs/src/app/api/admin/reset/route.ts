import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    // 1. Drop the entire collection to remove bad indexes and data
    await mongoose.connection.collection('users').drop();
    
    return NextResponse.json({ success: true, message: "Users collection dropped. Indexes reset." });
  } catch (error: any) {
    // If collection doesn't exist, that's fine
    if (error.code === 26) {
        return NextResponse.json({ success: true, message: "Collection didn't exist, nothing to drop." });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}