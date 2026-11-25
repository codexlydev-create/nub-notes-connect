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
  uploadedByDepartment?: string;
  uploadedByAvatarUrl?: string;
  views: number;
  likes: number;
  dislikes: number;
  saves: number;
  createdAt: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  pageCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department?: string;
  avatar?: string;
  avatarUrl?: string;
  avatarKey?: string;
  publicContact?: PublicContact | null;
  role?: "Contributor" | "Active Uploader";
  emailVerified?: boolean;
  pendingEmail?: string;
}

export interface PublicContact {
  platformName: string;
  platformUrl: string;
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