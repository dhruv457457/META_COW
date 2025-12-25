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

    console.log("=== FOLLOW REQUEST ===");
    console.log("Follower:", followerLower);
    console.log("Target:", targetLower);

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
    
    console.log("Follower user found:", !!followerUser);
    console.log("Target user found:", !!targetUser);
    
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

    // Check if already following - return success instead of error
    const currentFollowing = followerUser.following || [];
    const alreadyFollowing = currentFollowing.some((addr: string) => 
      addr.toLowerCase() === targetLower
    );
    
    console.log("Current following list:", currentFollowing);
    console.log("Already following?:", alreadyFollowing);
    
    if (alreadyFollowing) {
      // Return success but indicate already following
      return NextResponse.json({ 
        success: true,
        message: "Already following this user",
        alreadyFollowing: true,
        followers: targetUser.followers?.length || 0,
      });
    }

    // Update follower's following list
    const updatedFollower = await User.findOneAndUpdate(
      { walletAddress: followerLower },
      { $addToSet: { following: targetLower } },
      { new: true }
    );

    // Update target's followers list
    const updatedTarget = await User.findOneAndUpdate(
      { walletAddress: targetLower },
      { $addToSet: { followers: followerLower } },
      { new: true }
    );

    console.log("Updated follower following count:", updatedFollower?.following?.length);
    console.log("Updated target followers count:", updatedTarget?.followers?.length);

    return NextResponse.json({ 
      success: true,
      message: "Successfully followed user",
      followers: updatedTarget?.followers?.length || 0,
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

    console.log("=== UNFOLLOW REQUEST ===");
    console.log("Unfollower:", followerLower);
    console.log("Target:", targetLower);

    // Update follower's following list
    const updatedFollower = await User.findOneAndUpdate(
      { walletAddress: followerLower },
      { $pull: { following: targetLower } },
      { new: true }
    );

    // Update target's followers list
    const updatedTarget = await User.findOneAndUpdate(
      { walletAddress: targetLower },
      { $pull: { followers: followerLower } },
      { new: true }
    );

    console.log("Updated follower following count:", updatedFollower?.following?.length);
    console.log("Updated target followers count:", updatedTarget?.followers?.length);

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