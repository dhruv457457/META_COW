import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function cleanDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    // Step 1: Check if users collection exists
    const collections = await db.listCollections({ name: 'users' }).toArray();
    
    if (collections.length === 0) {
      console.log("⚠️  Collection 'users' doesn't exist yet. No cleanup needed.");
      return;
    }

    console.log("📋 Found 'users' collection. Checking indexes...");

    // Step 2: Get all indexes
    const indexes = await db.collection('users').indexes();
    console.log("Current indexes:", indexes.map(i => i.name));

    // Step 3: Drop bad indexes (wallet_1, not walletAddress_1)
    for (const index of indexes) {
      if (index.name !== '_id_' && index.name.includes('wallet_1')) {
        console.log(`🗑️  Dropping old index: ${index.name}`);
        await db.collection('users').dropIndex(index.name);
      }
    }

    // Step 4: Drop the entire collection to start fresh
    console.log("💥 Dropping 'users' collection...");
    await db.collection('users').drop();
    console.log("✅ Collection dropped successfully");

    // Step 5: Verify cleanup
    const remainingCollections = await db.listCollections({ name: 'users' }).toArray();
    if (remainingCollections.length === 0) {
      console.log("✨ Database cleanup complete! Collection is gone.");
    }

    console.log("\n🎉 All done! Your database is clean.");
    console.log("💡 Next steps:");
    console.log("   1. Restart your dev server: npm run dev");
    console.log("   2. Go to /profile and create a new user");
    console.log("   3. MongoDB will create the collection with correct indexes");

  } catch (error: any) {
    console.error("❌ Error during cleanup:", error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

cleanDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));