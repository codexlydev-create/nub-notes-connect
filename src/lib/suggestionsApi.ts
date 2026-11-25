import { api } from "./api";
import type { SuggestionFormValues } from "./communitySchemas";

export type SuggestionReaction = "like" | "dislike";

export interface SuggestionComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  parentCommentId: string | null;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  topic: string;
  field: string;
  description: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  comments: SuggestionComment[];
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  myReaction: SuggestionReaction | null;
}

export const suggestionsApi = {
  list: () => api<{ items: Suggestion[] }>("/api/suggestions", { auth: true }),
  create: (data: SuggestionFormValues) =>
    api<{ item: Suggestion }>("/api/suggestions", { method: "POST", body: data, auth: true }),
  update: (id: string, data: Partial<SuggestionFormValues>) =>
    api<{ item: Suggestion }>(`/api/suggestions/${id}`, { method: "PATCH", body: data, auth: true }),
  remove: (id: string) =>
    api<{ ok: true }>(`/api/suggestions/${id}`, { method: "DELETE", auth: true }),
  react: (id: string, value: SuggestionReaction) =>
    api<{ likes: number; dislikes: number; myReaction: SuggestionReaction | null }>(
      `/api/suggestions/${id}/reaction`, { method: "POST", body: { value }, auth: true },
    ),
  addComment: (id: string, data: { text: string; parentCommentId?: string }) =>
    api<{ comment: SuggestionComment }>(`/api/suggestions/${id}/comments`, {
      method: "POST", body: data, auth: true,
    }),
};