import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

// POST: Like/Unlike a post
export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const body = await req.json();
    const { postId, userWallet, action } = body; // action: "like" or "unlike"
    
    if (!postId || !userWallet || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const walletLower = userWallet.toLowerCase();
    
    if (action === "like") {
      // Add to likes array
      const post = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: walletLower } },
        { new: true }
      );
      
      if (!post) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        likes: post.likes.length 
      });
      
    } else if (action === "unlike") {
      // Remove from likes array
      const post = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: walletLower } },
        { new: true }
      );
      
      if (!post) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        likes: post.likes.length 
      });
      
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error("POST /api/posts/like error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to like/unlike post" },
      { status: 500 }
    );
  }
}