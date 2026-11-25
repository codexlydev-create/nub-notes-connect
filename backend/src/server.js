/**
 * Vercel serverless entry — exports the Express app instead of calling listen().
 * Locally, `src/index.js` imports this and starts the HTTP server.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";

import { ensureDB } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import notesRoutes from "./routes/notes.js";
import usersRoutes from "./routes/users.js";
import contactRoutes from "./routes/contact.js";
import uploadsRoutes from "./routes/uploads.js";
import taxonomyRoutes from "./routes/taxonomy.js";
import suggestionsRoutes from "./routes/suggestions.js";

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

app.use(cors({
  origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN.split(","),
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Ensure DB is ready for every API call (cached connection — see lib/db.js).
app.use("/api", ensureDB);

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/taxonomy", taxonomyRoutes);
app.use("/api/suggestions", suggestionsRoutes);

app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

export default app;