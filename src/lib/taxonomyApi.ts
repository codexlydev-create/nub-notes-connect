import { api } from "./api";

export interface Taxonomy {
  departments: string[];
  coursesByDept: Record<string, string[]>;
}

export const taxonomyApi = {
  list: () => api<Taxonomy>("/api/taxonomy"),
  add: (input: { kind: "department" | "course"; name: string; parent?: string }) =>
    api<{ ok: true }>("/api/taxonomy", { method: "POST", body: input, auth: true }),
};