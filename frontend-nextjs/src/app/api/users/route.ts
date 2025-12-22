import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// GET: Get list of users (for search)
export async function GET(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sortBy") || "totalSwaps"; // totalSwaps, reputation, createdAt
  const search = searchParams.get("search") || "";

  try {
    let query: any = {};
    
    // Search by username if provided
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }
    
    // Determine sort order
    let sort: any = {};
    switch (sortBy) {
      case "reputation":
        sort = { reputation: -1 };
        break;
      case "followers":
        sort = { 'followers': -1 }; // This will sort by array length
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "active":
        sort = { lastActive: -1 };
        break;
      default:
        sort = { totalSwaps: -1 };
    }

    const users = await User.find(query)
      .sort(sort)
      .limit(Math.min(limit, 50)) // Max 50 users
      .select('username bio avatar walletAddress followers following reputation totalSwaps createdAt lastActive')
      .lean();

    // Add computed follower/following counts
    const usersWithCounts = users.map(user => ({
      ...user,
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
    }));

    return NextResponse.json({ 
      users: usersWithCounts,
      count: usersWithCounts.length,
    });
    
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" }, 
      { status: 500 }
    );
  }
}