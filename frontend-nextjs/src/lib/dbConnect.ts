// src/lib/dbConnect.ts
import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global caching to prevent hot reload issues in Next.js
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  // Check for MongoDB URI inside the function
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in .env or .env.local');
  }

  // ✅ Return existing connection immediately (no await needed)
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  // ✅ Return pending connection if already connecting
  if (cached.promise) {
    console.log('⏳ Waiting for pending MongoDB connection...');
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      cached.promise = null;
      throw e;
    }
  }

  // ✅ Create new connection with optimized settings
  console.log('🔄 Creating new MongoDB connection...');
  console.log('🔍 Connecting to:', MONGODB_URI.substring(0, 25) + '...');
  
  const opts = {
    bufferCommands: false,       // Fail fast if not connected
    maxPoolSize: 10,             // ✅ Max 10 connections in pool (reuse!)
    minPoolSize: 5,              // ✅ Keep 5 connections alive always
    serverSelectionTimeoutMS: 5000,  // ✅ Timeout after 5s instead of 30s
    socketTimeoutMS: 45000,      // ✅ Close inactive sockets after 45s
    family: 4,                   // ✅ Use IPv4 only (skip IPv6 DNS lookup = faster!)
  };

  try {
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host}`);
      return mongoose;
    });

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', e);
    throw e;
  }
}

export default dbConnect;