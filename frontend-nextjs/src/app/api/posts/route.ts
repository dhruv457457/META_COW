import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import User from "@/models/User";

// GET: Fetch posts (feed)
export async function GET(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const userWallet = searchParams.get("userWallet"); // Fetch specific user's posts
  const following = searchParams.get("following"); // Fetch posts from followed users
  const timeFilter = searchParams.get("timeFilter") || "7d"; // 1h, 24h, 7d, all
  
  try {
    let query: any = { visibility: "public" };
    
    // Filter by user
    if (userWallet) {
      query.userWallet = userWallet.toLowerCase();
    }
    
    // Filter by following
    if (following) {
      const user = await User.findOne({ walletAddress: following.toLowerCase() });
      if (user && user.following.length > 0) {
        query.userWallet = { $in: user.following };
      } else {
        // No following, return empty
        return NextResponse.json({ posts: [], count: 0 });
      }
    }
    
    // Time filter
    if (timeFilter !== "all") {
      const now = Math.floor(Date.now() / 1000);
      let secondsAgo = 0;
      
      switch (timeFilter) {
        case "1h":
          secondsAgo = 3600;
          break;
        case "24h":
          secondsAgo = 86400;
          break;
        case "7d":
          secondsAgo = 604800;
          break;
      }
      
      if (secondsAgo > 0) {
        const timestamp = now - secondsAgo;
        query["swapData.timestamp"] = { $gte: timestamp };
      }
    }
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .lean();
    
    return NextResponse.json({ 
      posts,
      count: posts.length 
    });
    
  } catch (error: any) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" }, 
      { status: 500 }
    );
  }
}

// POST: Create a new post
export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const body = await req.json();
    const {
      userWallet,
      username,
      avatar,
      caption,
      swapData,
      visibility = "public",
    } = body;
    
    // Validate required fields
    if (!userWallet || !username || !caption || !swapData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate swap data
    if (
      !swapData.inputToken ||
      !swapData.outputToken ||
      !swapData.inputAmount ||
      !swapData.outputAmount ||
      !swapData.txHash ||
      !swapData.timestamp
    ) {
      return NextResponse.json(
        { error: "Invalid swap data" },
        { status: 400 }
      );
    }
    
    // Check if post already exists for this transaction
    const existingPost = await Post.findOne({ "swapData.txHash": swapData.txHash });
    if (existingPost) {
      return NextResponse.json(
        { error: "Post already exists for this transaction" },
        { status: 409 }
      );
    }
    
    // Create post
    const post = await Post.create({
      userWallet: userWallet.toLowerCase(),
      username,
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${userWallet}`,
      caption,
      swapData: {
        ...swapData,
        inputToken: swapData.inputToken.toLowerCase(),
        outputToken: swapData.outputToken.toLowerCase(),
        pairAddress: swapData.pairAddress?.toLowerCase() || "",
      },
      visibility,
      likes: [],
      comments: [],
      createdAt: new Date(),
    });
    
    return NextResponse.json({ 
      success: true,
      post 
    });
    
  } catch (error: any) {
    console.error("POST /api/posts error:", error);
    
    // Handle duplicate transaction error
    if (error.code === 11000 && error.message.includes("txHash")) {
      return NextResponse.json(
        { error: "Post already exists for this transaction" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a post
export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const userWallet = searchParams.get("userWallet");
    
    if (!postId || !userWallet) {
      return NextResponse.json(
        { error: "Missing postId or userWallet" },
        { status: 400 }
      );
    }
    
    // Find post and verify ownership
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    if (post.userWallet !== userWallet.toLowerCase()) {
      return NextResponse.json(
        { error: "Unauthorized - you can only delete your own posts" },
        { status: 403 }
      );
    }
    
    await Post.findByIdAndDelete(postId);
    
    return NextResponse.json({ 
      success: true,
      message: "Post deleted" 
    });
    
  } catch (error: any) {
    console.error("DELETE /api/posts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}