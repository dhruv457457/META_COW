import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Session from "@/models/Session";
import CopyTradePermission from "@/models/CopyTradePermission";
import CopyTrade from "@/models/CopyTrade";

// GET: List user's session accounts with statistics
export async function GET(req: NextRequest) {
  await dbConnect();
  
  try {
    const { searchParams } = new URL(req.url);
    const userWallet = searchParams.get("userWallet");
    
    if (!userWallet) {
      return NextResponse.json(
        { error: "userWallet is required" },
        { status: 400 }
      );
    }
    
    const walletLower = userWallet.toLowerCase();
    
    // Get user's session
    const session = await Session.findOne({ userAddress: walletLower });
    
    if (!session) {
      return NextResponse.json({ 
        session: null,
        permissions: [],
        stats: {
          totalPermissions: 0,
          activePermissions: 0,
          totalTrades: 0,
          totalVolume: "0",
        }
      });
    }
    
    // Get permissions using this session
    const permissions = await CopyTradePermission.find({ 
      sessionAccount: session.address.toLowerCase(),
      userWallet: walletLower
    }).lean();
    
    // Get trade statistics
    const trades = await CopyTrade.find({ 
      userId: walletLower 
    }).lean();
    
    // Calculate stats
    const totalVolume = trades.reduce((sum, trade) => {
      try {
        return sum + parseFloat(trade.amount || "0");
      } catch {
        return sum;
      }
    }, 0);
    
    const activePermissions = permissions.filter(p => p.isActive).length;
    
    return NextResponse.json({
      session: {
        address: session.address,
        createdAt: session.createdAt,
      },
      permissions: permissions.map(p => ({
        id: p._id,
        traderAddress: p.traderAddress,
        traderUsername: p.traderUsername,
        inputToken: p.inputToken,
        dailyLimit: p.dailyLimit,
        spentToday: p.spentToday,
        isActive: p.isActive,
        expiresAt: p.expiresAt,
        createdAt: p.createdAt,
      })),
      stats: {
        totalPermissions: permissions.length,
        activePermissions,
        totalTrades: trades.length,
        totalVolume: totalVolume.toFixed(4),
      },
    });
    
  } catch (error: any) {
    console.error("GET /api/sessions/list error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}