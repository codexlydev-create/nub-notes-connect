import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, required: true, trim: true },
  authorAvatarUrl: { type: String, default: "" },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now },
});

const suggestionSchema = new mongoose.Schema({
  topic: { type: String, required: true, trim: true, maxlength: 120 },
  field: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  authorName: { type: String, required: true, trim: true },
  authorAvatarUrl: { type: String, default: "" },
  comments: { type: [commentSchema], default: [] },
}, { timestamps: true });

suggestionSchema.index({ createdAt: -1 });

suggestionSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    topic: this.topic,
    field: this.field,
    description: this.description,
    authorId: this.authorId?.toString(),
    authorName: this.authorName,
    authorAvatarUrl: this.authorAvatarUrl || "",
    comments: this.comments.map((comment) => ({
      id: comment._id.toString(),
      authorId: comment.authorId?.toString(),
      authorName: comment.authorName,
      authorAvatarUrl: comment.authorAvatarUrl || "",
      text: comment.text,
      parentCommentId: comment.parentCommentId?.toString() || null,
      createdAt: comment.createdAt,
    })),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model("Suggestion", suggestionSchema);