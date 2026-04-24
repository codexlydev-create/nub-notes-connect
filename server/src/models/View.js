import mongoose from "mongoose";

// Dedupe view counts: one row per (viewerKey, note).
const viewSchema = new mongoose.Schema(
  {
    viewerKey: { type: String, required: true, index: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true, index: true },
  },
  { timestamps: true }
);

viewSchema.index({ viewerKey: 1, note: 1 }, { unique: true });

export default mongoose.model("View", viewSchema);