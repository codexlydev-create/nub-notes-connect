import mongoose from "mongoose";

// One row per (user, note) capturing like/dislike/save state.
const interactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    liked: { type: Boolean, default: false },
    disliked: { type: Boolean, default: false },
    saved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interactionSchema.index({ user: 1, note: 1 }, { unique: true });

export default mongoose.model("Interaction", interactionSchema);