// app/api/users/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const { wallets } = await req.json();
    
    if (!wallets || !Array.isArray(wallets)) {
      return NextResponse.json(
        { error: "wallets array required" },
        { status: 400 }
      );
    }
    
    // Normalize all addresses to lowercase
    const normalizedWallets = wallets.map((w: string) => w.toLowerCase());
    
    // ✅ FETCH ALL USERS IN ONE QUERY (instead of N queries!)
    const users = await User.find({
      walletAddress: { $in: normalizedWallets }
    }).lean();
    
    // Create a map for fast lookup
    const userMap: Record<string, any> = {};
    users.forEach((user) => {
      const followers = Array.isArray(user.followers) ? user.followers : [];
      const following = Array.isArray(user.following) ? user.following : [];
      
      userMap[user.walletAddress] = {
        username: user.username,
        bio: user.bio || "",
        avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.walletAddress}`,
        walletAddress: user.walletAddress,
        followers: followers.length,
        following: following.length,
        followersList: followers,
        followingList: following,
        reputation: user.reputation || 100,
        totalSwaps: user.totalSwaps || 0,
        totalVolume: user.totalVolume || "0",
        createdAt: user.createdAt,
        lastActive: user.lastActive,
      };
    });
    
    return NextResponse.json({
      success: true,
      users: userMap,
    });
    
  } catch (error: any) {
    console.error("POST /api/users/batch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}