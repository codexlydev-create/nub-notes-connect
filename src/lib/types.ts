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
  views: number;
  likes: number;
  dislikes: number;
  saves: number;
  createdAt: string;
  fileUrl?: string;
  /** Data URL of the uploaded PDF (used when no backend is connected). */
  fileData?: string;
  /** Original file name. */
  fileName?: string;
  /** File size in bytes. */
  fileSize?: number;
  /** Number of pages in the PDF. */
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
  /** New email pending verification — user still logs in with `email`. */
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
  /** ISO date of most recent upload (or undefined). */
  lastUploadAt?: string;
  /** Active = uploaded in last 15 days. */
  status: "Active" | "Inactive";
}