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

    const followerLower = followerWallet.toLowerCase();
    const targetLower = targetWallet.toLowerCase();

    // Prevent following yourself
    if (followerLower === targetLower) {
      return NextResponse.json(
        { error: "Cannot follow yourself" }, 
        { status: 400 }
      );
    }

    // Check if both users exist
    const [followerUser, targetUser] = await Promise.all([
      User.findOne({ walletAddress: followerLower }),
      User.findOne({ walletAddress: targetLower })
    ]);
    
    if (!followerUser) {
      return NextResponse.json(
        { error: "Follower user not found" }, 
        { status: 404 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" }, 
        { status: 404 }
      );
    }

    // Check if already following
    if (followerUser.following && followerUser.following.includes(targetLower)) {
      return NextResponse.json(
        { error: "Already following this user" }, 
        { status: 400 }
      );
    }

    // Update follower's following list
    await User.findOneAndUpdate(
      { walletAddress: followerLower },
      { $addToSet: { following: targetLower } }
    );

    // Update target's followers list
    await User.findOneAndUpdate(
      { walletAddress: targetLower },
      { $addToSet: { followers: followerLower } }
    );

    return NextResponse.json({ 
      success: true,
      message: "Successfully followed user",
      followers: (targetUser.followers?.length || 0) + 1,
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

    const followerLower = followerWallet.toLowerCase();
    const targetLower = targetWallet.toLowerCase();

    // Update follower's following list
    await User.findOneAndUpdate(
      { walletAddress: followerLower },
      { $pull: { following: targetLower } }
    );

    // Update target's followers list
    await User.findOneAndUpdate(
      { walletAddress: targetLower },
      { $pull: { followers: followerLower } }
    );

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