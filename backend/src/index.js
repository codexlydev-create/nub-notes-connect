/**
 * Local dev entry — boots the same Express app exported from server.js
 * and keeps it listening. In Vercel, server.js is used directly.
 */
import "dotenv/config";
import app from "./server.js";
import { connectDB } from "./lib/db.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("✓ MongoDB connected");
    app.listen(PORT, () => console.log(`✓ API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    // Still start the server so health/UX endpoints respond — DB calls will retry.
    app.listen(PORT, () => console.log(`✓ API running (no DB) on http://localhost:${PORT}`));
  });