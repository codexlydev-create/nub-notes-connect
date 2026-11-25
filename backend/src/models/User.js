import mongoose from "mongoose";

const publicContactSchema = new mongoose.Schema({
  platformName: { type: String, trim: true, maxlength: 60 },
  platformUrl: { type: String, trim: true, maxlength: 2048 },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    studentId: { type: String, default: "", trim: true, index: true },
    department: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    avatarKey: { type: String, default: "" },
    publicContact: { type: publicContactSchema, default: null },
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
    publicContact: this.publicContact?.platformName && this.publicContact?.platformUrl
      ? { platformName: this.publicContact.platformName, platformUrl: this.publicContact.platformUrl }
      : null,
    emailVerified: this.emailVerified,
    pendingEmail: this.pendingEmail || undefined,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);