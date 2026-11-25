import mongoose from "mongoose";

const suggestionReactionSchema = new mongoose.Schema({
  suggestion: { type: mongoose.Schema.Types.ObjectId, ref: "Suggestion", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  value: { type: String, enum: ["like", "dislike"], required: true },
}, { timestamps: true });

suggestionReactionSchema.index({ suggestion: 1, user: 1 }, { unique: true });

export default mongoose.model("SuggestionReaction", suggestionReactionSchema);