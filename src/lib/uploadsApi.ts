import { api } from "./api";
import type { Note } from "./types";

export interface PresignResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
}

export const uploadsApi = {
  presign: (input: { fileName: string; fileType: string; fileSize?: number }) =>
    api<PresignResponse>("/api/uploads/generate-upload-url", {
      method: "POST",
      body: input,
      auth: true,
    }),
  presignAvatar: (input: { fileName: string; fileType: string; fileSize?: number }) =>
    api<PresignResponse>("/api/uploads/avatar-upload-url", {
      method: "POST",
      body: input,
      auth: true,
    }),
  saveFile: (data: {
    title: string;
    description?: string;
    department: string;
    course: string;
    courseCode: string;
    type: "Slide" | "Hand Notes";
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileKey?: string;
    pageCount?: number;
  }) => api<{ note: Note }>("/api/uploads/save-file", { method: "POST", body: data, auth: true }),
};

/**
 * PUT a File directly to a presigned URL (e.g. Cloudflare R2) with progress.
 */
export function putToPresignedUrl(
  url: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable || !onProgress) return;
      onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}