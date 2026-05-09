/**
 * MongoDB connection helper.
 *
 * Next.js runs in a hot-reload dev environment, so this file caches the
 * database connection across reloads — otherwise we'd open hundreds of
 * connections and crash the free MongoDB Atlas tier.
 */

import mongoose from "mongoose";

// The MongoDB connection string comes from your .env.local file.
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env.local file");
}

// We store the connection promise in a global variable so it survives
// Next.js hot-reloads in development mode.
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  // If we already have a live connection, reuse it.
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection is in progress, start one.
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // Don't queue operations if connection drops
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
