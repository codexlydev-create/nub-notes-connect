import { SEED_NOTES } from "@/data/seed";
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
  viewed: "ns_viewed",
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

export function initStore() {
  if (!localStorage.getItem(K.notes)) write(K.notes, SEED_NOTES);
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

// Contributors — derived from real uploaders + registered users
export const contributorsApi = {
  list: (): Contributor[] => {
    const notes = notesApi.list();
    const users = read<(User & { password: string })[]>(K.users, []);
    const byId = new Map<string, Contributor>();
    for (const n of notes) {
      const u = users.find((x) => x.id === n.uploadedById);
      const existing = byId.get(n.uploadedById) ?? {
        id: n.uploadedById,
        name: u?.name ?? n.uploadedBy,
        email: u?.email ?? "",
        studentId: u?.studentId ?? "",
        role: "Contributor",
        notesCount: 0,
        views: 0,
        likes: 0,
        rank: 0,
      };
      existing.notesCount += 1;
      existing.views += n.views;
      existing.likes += n.likes;
      byId.set(n.uploadedById, existing);
    }
    const arr = Array.from(byId.values())
      .map((c) => ({ ...c, role: (c.notesCount >= 10 ? "Active Uploader" : "Contributor") as Contributor["role"] }))
      .sort((a, b) => b.notesCount - a.notesCount || b.likes - a.likes);
    arr.forEach((c, i) => (c.rank = i + 1));
    return arr;
  },
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
      emailVerified: true,
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
  updateProfile: (id: string, patch: { name?: string; email?: string; studentId?: string }) => {
    const users = read<(User & { password: string })[]>(K.users, []);
    const i = users.findIndex((x) => x.id === id);
    if (i === -1) throw new Error("User not found");
    if (patch.email && patch.email !== users[i].email) {
      if (users.some((u) => u.email === patch.email)) throw new Error("Email already in use");
      users[i].email = patch.email;
      users[i].emailVerified = false;
    }
    if (patch.name) users[i].name = patch.name;
    if (patch.studentId) users[i].studentId = patch.studentId;
    write(K.users, users);
    const { password, ...safe } = users[i];
    write(K.session, safe);
    return safe as User;
  },
  changePassword: (id: string, currentPassword: string, newPassword: string) => {
    const users = read<(User & { password: string })[]>(K.users, []);
    const i = users.findIndex((x) => x.id === id);
    if (i === -1) throw new Error("User not found");
    if (users[i].password !== currentPassword) throw new Error("Current password is incorrect");
    users[i].password = newPassword;
    write(K.users, users);
  },
  verifyEmail: (id: string) => {
    const users = read<(User & { password: string })[]>(K.users, []);
    const i = users.findIndex((x) => x.id === id);
    if (i === -1) throw new Error("User not found");
    users[i].emailVerified = true;
    write(K.users, users);
    const current = read<User | null>(K.session, null);
    if (current?.id === id) {
      const { password, ...safe } = users[i];
      write(K.session, safe);
    }
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

// Per-user view tracking — increments once per user per note
export const viewsApi = {
  hasViewed: (userKey: string, noteId: string) => {
    const map = read<Record<string, string[]>>(K.viewed, {});
    return (map[userKey] ?? []).includes(noteId);
  },
  markViewed: (userKey: string, noteId: string) => {
    const map = read<Record<string, string[]>>(K.viewed, {});
    const list = map[userKey] ?? [];
    if (list.includes(noteId)) return false;
    map[userKey] = [...list, noteId];
    write(K.viewed, map);
    return true;
  },
};

// Anonymous viewer id — stable per browser for unauthenticated view-dedup
export function anonViewerId() {
  const KEY = "ns_anon";
  let v = localStorage.getItem(KEY);
  if (!v) { v = "anon_" + Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem(KEY, v); }
  return v;
}

export const themeKey = K.theme;