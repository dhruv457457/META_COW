import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// GET: Fetch a user profile by wallet address
export async function GET(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet")?.toLowerCase();

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
  }

  try {
    // Find user and update lastActive in one operation
    const user = await User.findOneAndUpdate(
      { walletAddress: wallet },
      { $set: { lastActive: new Date() } },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ found: false }, { status: 404 });
    }
    
    return NextResponse.json({
      username: user.username,
      bio: user.bio || "",
      avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}`,
      walletAddress: user.walletAddress,
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
      reputation: user.reputation || 100,
      totalSwaps: user.totalSwaps || 0,
      totalVolume: user.totalVolume || "0",
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    });
  } catch (error: any) {
    console.error("GET /api/users/profile error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// POST: Create or Update a profile
export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const body = await req.json();
    const { wallet, username, bio, avatar } = body;

    if (!wallet || !username) {
      return NextResponse.json(
        { error: "Wallet and Username required" }, 
        { status: 400 }
      );
    }

    const walletLower = wallet.toLowerCase();

    // Check if username is taken by another wallet
    const existingUser = await User.findOne({ 
      username, 
      walletAddress: { $ne: walletLower } 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" }, 
        { status: 409 }
      );
    }

    // Try to find existing user first
    let user = await User.findOne({ walletAddress: walletLower });

    if (user) {
      // Update existing user
      user.username = username;
      user.bio = bio || "";
      user.avatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}`;
      user.lastActive = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        walletAddress: walletLower,
        username,
        bio: bio || "",
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}`,
        followers: [],
        following: [],
        reputation: 100,
        totalSwaps: 0,
        totalVolume: "0",
        createdAt: new Date(),
        lastActive: new Date(),
      });
    }

    if (!user) {
      throw new Error("Failed to create/update user");
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        username: user.username,
        bio: user.bio || "",
        avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}`,
        walletAddress: user.walletAddress,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
        reputation: user.reputation || 100,
        totalSwaps: user.totalSwaps || 0,
      }
    });
    
  } catch (error: any) {
    console.error("POST /api/users/profile error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle duplicate username error
    if (error.code === 11000) {
      const field = error.message.includes('username') ? 'Username' : 'Wallet';
      return NextResponse.json(
        { error: `${field} already taken` }, 
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: messages.join(', ') }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to save profile" }, 
      { status: 500 }
    );
  }
}