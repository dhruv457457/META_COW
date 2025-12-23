// src/scripts/cleanup-sessions.ts
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI!;

async function cleanup() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected!\n");

    const db = mongoose.connection.db!;

    // 1. Show current state
    console.log("📊 Current State:");
    console.log("=================");

    const permissionsCount = await db.collection("copytrading_permissions").countDocuments();
    const sessionsCount = await db.collection("sessions").countDocuments();
    const tradesCount = await db.collection("copytrades").countDocuments();

    console.log(`Permissions: ${permissionsCount}`);
    console.log(`Sessions: ${sessionsCount}`);
    console.log(`Trades: ${tradesCount}\n`);

    if (permissionsCount > 0) {
      console.log("📋 Current Permissions:");
      const permissions = await db
        .collection("copytrading_permissions")
        .find({})
        .project({ userWallet: 1, sessionAccount: 1, traderUsername: 1, isActive: 1 })
        .toArray();

      permissions.forEach((p) => {
        console.log(`  User: ${p.userWallet}`);
        console.log(`  Session: ${p.sessionAccount}`);
        console.log(`  Trader: ${p.traderUsername}`);
        console.log(`  Active: ${p.isActive}`);
        console.log("  ---");
      });
      console.log();
    }

    if (sessionsCount > 0) {
      console.log("📋 Current Sessions:");
      const sessions = await db
        .collection("sessions")
        .find({})
        .project({ userAddress: 1, address: 1, createdAt: 1 })
        .toArray();

      sessions.forEach((s) => {
        console.log(`  User: ${s.userAddress}`);
        console.log(`  Session: ${s.address}`);
        console.log(`  Created: ${s.createdAt}`);
        console.log("  ---");
      });
      console.log();
    }

    // 2. Confirm deletion
    console.log("⚠️  WARNING: This will DELETE all permissions, sessions, and trades!");
    console.log("Press Ctrl+C now to cancel, or wait 3 seconds to continue...\n");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Delete everything
    console.log("🗑️  Deleting old data...");

    const permissionsDeleted = await db.collection("copytrading_permissions").deleteMany({});
    console.log(`✅ Deleted ${permissionsDeleted.deletedCount} permissions`);

    const sessionsDeleted = await db.collection("sessions").deleteMany({});
    console.log(`✅ Deleted ${sessionsDeleted.deletedCount} sessions`);

    const tradesDeleted = await db.collection("copytrades").deleteMany({});
    console.log(`✅ Deleted ${tradesDeleted.deletedCount} trade records\n`);

    // 4. Verify cleanup
    console.log("✅ Cleanup Complete!");
    console.log("===================");
    console.log(`Permissions remaining: ${await db.collection("copytrading_permissions").countDocuments()}`);
    console.log(`Sessions remaining: ${await db.collection("sessions").countDocuments()}`);
    console.log(`Trades remaining: ${await db.collection("copytrades").countDocuments()}\n`);

    console.log("🎯 Next Steps:");
    console.log("1. Go to your MetaCow DEX frontend");
    console.log("2. Click 'Auto Copy' on any trader");
    console.log("3. Complete the permission flow");
    console.log("4. Check Railway logs for successful trades!\n");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanup();