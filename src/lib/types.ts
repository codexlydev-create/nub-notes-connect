export type NoteType = "Slide" | "Hand Notes";

export interface Note {
  id: string;
  title: string;
  description: string;
  department: string;
  course: string;
  courseCode: string;
  type: NoteType;
  uploadedBy: string;
  uploadedById: string;
  uploadedByStudentId?: string;
  views: number;
  likes: number;
  dislikes: number;
  saves: number;
  createdAt: string;
  fileName?: string;
  fileSize?: number;
  pageCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  avatar?: string;
  role?: "Contributor" | "Active Uploader";
  emailVerified?: boolean;
  pendingEmail?: string;
}

export interface Contributor {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: "Contributor" | "Active Uploader";
  notesCount: number;
  views: number;
  likes: number;
  rank: number;
  lastUploadAt?: string;
  status: "Active" | "Inactive";
}