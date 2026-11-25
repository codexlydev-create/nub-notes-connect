import { api } from "./api";
import type { Note } from "./types";
import type { PublicContact } from "./types";

export interface ListParams {
  department?: string; course?: string; type?: string;
  q?: string; courseCode?: string; studentId?: string; page?: number; limit?: number;
}

export const notesApi = {
  list: (params: ListParams = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    return api<{ items: Note[]; total: number; page: number; limit: number; reactions?: Record<string, { liked: boolean; disliked: boolean; saved: boolean }> }>(
      `/api/notes${qs.toString() ? `?${qs}` : ""}`
      , { auth: true }
    );
  },
  get: (id: string) =>
    api<{ note: Note; me: { liked: boolean; disliked: boolean; saved: boolean } | null }>(
      `/api/notes/${id}`,
      { auth: true }
    ),
  create: (form: FormData) => api<{ note: Note }>("/api/notes", { method: "POST", body: form, auth: true }),
  update: (id: string, patch: Partial<Note>) =>
    api<{ note: Note }>(`/api/notes/${id}`, { method: "PATCH", body: patch, auth: true }),
  remove: (id: string) => api<{ ok: true }>(`/api/notes/${id}`, { method: "DELETE", auth: true }),
  like: (id: string) =>
    api<{ note: Note; me: { liked: boolean; disliked: boolean; saved: boolean } }>(
      `/api/notes/${id}/like`, { method: "POST", auth: true }
    ),
  dislike: (id: string) =>
    api<{ note: Note; me: { liked: boolean; disliked: boolean; saved: boolean } }>(
      `/api/notes/${id}/dislike`, { method: "POST", auth: true }
    ),
  save: (id: string) =>
    api<{ note: Note; me: { liked: boolean; disliked: boolean; saved: boolean } }>(
      `/api/notes/${id}/save`, { method: "POST", auth: true }
    ),
  myUploads: () => api<{ items: Note[] }>("/api/notes/me/uploads", { auth: true }),
  mySaved: () => api<{ items: Note[] }>("/api/notes/me/saved", { auth: true }),
};

export const contributorsApi = {
  list: () =>
    api<{
      items: Array<{ id: string; name: string; studentId: string; department?: string; avatarUrl?: string; publicContact?: PublicContact | null; uploads: number; totalViews: number; totalLikes: number; totalDislikes: number }>;
    }>("/api/users/contributors"),
};

export const contactApi = {
  send: (data: { name: string; email: string; subject?: string; message: string }) =>
    api<{ ok: true }>("/api/contact", { method: "POST", body: data }),
};