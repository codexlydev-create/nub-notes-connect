import { SEED_NOTES, SEED_CONTRIBUTORS } from "@/data/seed";
import type { Note, Contributor, User } from "./types";

// Simple localStorage-backed store. Structure mirrors a future Mongo API so
// swapping to real fetch() calls later is trivial.

const K = {
  notes: "ns_notes",
  users: "ns_users",
  session: "ns_session",
  likes: "ns_likes",
  dislikes: "ns_dislikes",
  saves: "ns_saves",
  contributors: "ns_contributors",
  theme: "ns_theme",
};

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Seed once
export function initStore() {
  if (!localStorage.getItem(K.notes)) write(K.notes, SEED_NOTES);
  if (!localStorage.getItem(K.contributors)) write(K.contributors, SEED_CONTRIBUTORS);
  if (!localStorage.getItem(K.users)) write<User[]>(K.users, []);
}

// Notes
export const notesApi = {
  list: (): Note[] => read<Note[]>(K.notes, []),
  get: (id: string) => notesApi.list().find((n) => n.id === id),
  create: (note: Note) => {
    const all = notesApi.list();
    write(K.notes, [note, ...all]);
  },
  update: (id: string, patch: Partial<Note>) => {
    const all = notesApi.list().map((n) => (n.id === id ? { ...n, ...patch } : n));
    write(K.notes, all);
  },
  remove: (id: string) => {
    write(K.notes, notesApi.list().filter((n) => n.id !== id));
  },
  incrementViews: (id: string) => {
    const all = notesApi.list().map((n) => (n.id === id ? { ...n, views: n.views + 1 } : n));
    write(K.notes, all);
  },
};

// Contributors
export const contributorsApi = {
  list: (): Contributor[] => read<Contributor[]>(K.contributors, []),
};

// Auth
export const authApi = {
  register: (u: { name: string; email: string; studentId: string; password: string }) => {
    const users = read<(User & { password: string })[]>(K.users, []);
    if (users.some((x) => x.email === u.email)) throw new Error("Email already registered");
    const user: User & { password: string } = {
      id: "user_" + Date.now(),
      name: u.name,
      email: u.email,
      studentId: u.studentId,
      password: u.password,
      role: "Contributor",
    };
    users.push(user);
    write(K.users, users);
    const { password, ...safe } = user;
    write(K.session, safe);
    return safe;
  },
  login: (email: string, password: string) => {
    const users = read<(User & { password: string })[]>(K.users, []);
    const u = users.find((x) => x.email === email && x.password === password);
    if (!u) throw new Error("Invalid email or password");
    const { password: _, ...safe } = u;
    write(K.session, safe);
    return safe;
  },
  logout: () => localStorage.removeItem(K.session),
  current: (): User | null => read<User | null>(K.session, null),
  resetPassword: (email: string, newPassword: string) => {
    const users = read<(User & { password: string })[]>(K.users, []);
    const i = users.findIndex((x) => x.email === email);
    if (i === -1) throw new Error("No account with that email");
    users[i].password = newPassword;
    write(K.users, users);
  },
};

// Interactions
function toggleSet(key: string, userId: string, noteId: string): boolean {
  const map = read<Record<string, string[]>>(key, {});
  const list = map[userId] ?? [];
  const has = list.includes(noteId);
  map[userId] = has ? list.filter((x) => x !== noteId) : [...list, noteId];
  write(key, map);
  return !has;
}

export const interactionsApi = {
  toggleLike: (userId: string, noteId: string) => {
    const now = toggleSet(K.likes, userId, noteId);
    const notes = notesApi.list().map((n) =>
      n.id === noteId ? { ...n, likes: Math.max(0, n.likes + (now ? 1 : -1)) } : n
    );
    write(K.notes, notes);
    return now;
  },
  toggleDislike: (userId: string, noteId: string) => {
    const now = toggleSet(K.dislikes, userId, noteId);
    const notes = notesApi.list().map((n) =>
      n.id === noteId ? { ...n, dislikes: Math.max(0, n.dislikes + (now ? 1 : -1)) } : n
    );
    write(K.notes, notes);
    return now;
  },
  toggleSave: (userId: string, noteId: string) => {
    const now = toggleSet(K.saves, userId, noteId);
    const notes = notesApi.list().map((n) =>
      n.id === noteId ? { ...n, saves: Math.max(0, n.saves + (now ? 1 : -1)) } : n
    );
    write(K.notes, notes);
    return now;
  },
  isLiked: (userId: string, noteId: string) =>
    (read<Record<string, string[]>>(K.likes, {})[userId] ?? []).includes(noteId),
  isDisliked: (userId: string, noteId: string) =>
    (read<Record<string, string[]>>(K.dislikes, {})[userId] ?? []).includes(noteId),
  isSaved: (userId: string, noteId: string) =>
    (read<Record<string, string[]>>(K.saves, {})[userId] ?? []).includes(noteId),
  savedIds: (userId: string) => read<Record<string, string[]>>(K.saves, {})[userId] ?? [],
};

export const themeKey = K.theme;