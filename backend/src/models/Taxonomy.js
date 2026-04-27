import mongoose from "mongoose";

/**
 * Stores user-added departments and courses so they can power the Find filter
 * and the Upload form even after the original "Others" entry was made.
 * kind: "department" | "course"
 * For courses, parent = department name.
 */
const taxonomySchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["department", "course"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    parent: { type: String, default: "", trim: true, index: true },
  },
  { timestamps: true }
);

taxonomySchema.index({ kind: 1, name: 1, parent: 1 }, { unique: true });

export default mongoose.model("Taxonomy", taxonomySchema);