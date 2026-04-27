import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.warn("[db] MONGODB_URI / MONGO_URI is not set");
}

let cached = global.__noteshare_mongoose;
if (!cached) {
  cached = global.__noteshare_mongoose = { conn: null, promise: null };
}

/**
 * Returns a cached mongoose connection — safe for serverless cold starts.
 * Disables mongoose buffering so we never hang on a missing connection.
 */
export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

  if (!cached.promise) {
    mongoose.set("bufferCommands", false);
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

/** Express middleware to ensure DB is connected before each request. */
export async function ensureDB(_req, res, next) {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.error("[db] connect failed:", e.message);
    res.status(503).json({ error: "Database temporarily unavailable. Please retry." });
  }
}