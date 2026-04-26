import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    department: { type: String, required: true, index: true },
    course: { type: String, required: true, index: true },
    courseCode: { type: String, required: true, index: true },
    type: { type: String, enum: ["Slide", "Hand Notes"], required: true, index: true },

    fileName: { type: String, default: "" },
    fileMime: { type: String, default: "application/pdf" },
    fileSize: { type: Number, default: 0 },
    filePath: { type: String, default: "" }, // relative to uploads/
    pageCount: { type: Number, default: 0 },

    uploadedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      name: { type: String, required: true },
      studentId: { type: String, default: "" },
    },

    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
  },
  { timestamps: true }
);

noteSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    department: this.department,
    course: this.course,
    courseCode: this.courseCode,
    type: this.type,
    fileName: this.fileName,
    fileSize: this.fileSize,
    pageCount: this.pageCount,
    uploadedBy: this.uploadedBy?.name,
    uploadedById: this.uploadedBy?.id?.toString(),
    uploadedByStudentId: this.uploadedBy?.studentId || "",
    views: this.views,
    likes: this.likes,
    dislikes: this.dislikes,
    saves: this.saves,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Note", noteSchema);