import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    studentId: { type: String, default: "", trim: true, index: true },
    department: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },
    pendingEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    studentId: this.studentId,
    department: this.department,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    emailVerified: this.emailVerified,
    pendingEmail: this.pendingEmail || undefined,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);