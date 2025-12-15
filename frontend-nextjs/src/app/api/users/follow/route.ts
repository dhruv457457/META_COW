import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// POST: Follow a user
export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const body = await req.json();
    const { followerWallet, targetWallet } = body;

    if (!followerWallet || !targetWallet) {
      return NextResponse.json(
        { error: "Both followerWallet and targetWallet required" }, 
        { status: 400 }
      );
    }

    const followerUser = await User.findOne({ 
      walletAddress: followerWallet.toLowerCase() 
    });
    
    if (!followerUser) {
      return NextResponse.json(
        { error: "Follower user not found" }, 
        { status: 404 }
      );
    }

    const targetUser = await User.findOne({ 
      walletAddress: targetWallet.toLowerCase() 
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" }, 
        { status: 404 }
      );
    }

    // Use the method to follow
    await followerUser.followUser(targetWallet);

    return NextResponse.json({ 
      success: true,
      message: "Successfully followed user",
      followers: targetUser.followers.length + 1,
    });
    
  } catch (error: any) {
    console.error("POST /api/users/follow error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to follow user" }, 
      { status: 500 }
    );
  }
}

// DELETE: Unfollow a user
export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  try {
    const { searchParams } = new URL(req.url);
    const followerWallet = searchParams.get("followerWallet");
    const targetWallet = searchParams.get("targetWallet");

    if (!followerWallet || !targetWallet) {
      return NextResponse.json(
        { error: "Both followerWallet and targetWallet required" }, 
        { status: 400 }
      );
    }

    const followerUser = await User.findOne({ 
      walletAddress: followerWallet.toLowerCase() 
    });
    
    if (!followerUser) {
      return NextResponse.json(
        { error: "Follower user not found" }, 
        { status: 404 }
      );
    }

    // Use the method to unfollow
    await followerUser.unfollowUser(targetWallet);

    return NextResponse.json({ 
      success: true,
      message: "Successfully unfollowed user",
    });
    
  } catch (error: any) {
    console.error("DELETE /api/users/follow error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unfollow user" }, 
      { status: 500 }
    );
  }
}