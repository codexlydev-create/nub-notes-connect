import type { Note, Contributor } from "@/lib/types";

export const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Business Administration",
  "English",
  "Law",
  "Pharmacy",
  "Civil Engineering",
];

export const COURSES_BY_DEPT: Record<string, string[]> = {
  "Computer Science & Engineering": [
    "Data Structures",
    "Algorithms",
    "Operating Systems",
    "Database Systems",
    "Computer Networks",
    "Software Engineering",
  ],
  "Electrical & Electronic Engineering": [
    "Circuit Analysis",
    "Digital Logic",
    "Signals & Systems",
    "Power Electronics",
  ],
  "Business Administration": [
    "Principles of Management",
    "Financial Accounting",
    "Marketing",
    "Microeconomics",
  ],
  English: ["Linguistics", "Modern Poetry", "Shakespeare", "Academic Writing"],
  Law: ["Constitutional Law", "Contract Law", "Criminal Law"],
  Pharmacy: ["Pharmacology I", "Medicinal Chemistry", "Pharmaceutics"],
  "Civil Engineering": ["Structural Analysis", "Geotechnical Eng.", "Fluid Mechanics"],
};

const mkNote = (n: Partial<Note> & { id: string; title: string }): Note => ({
  description:
    "Concise, exam-ready notes covering core concepts, worked examples, and practice problems curated by students.",
  department: "Computer Science & Engineering",
  course: "Data Structures",
  courseCode: "CSE 2101",
  type: "Hand Notes",
  uploadedBy: "Ayesha Rahman",
  uploadedById: "u1",
  views: Math.floor(Math.random() * 1200) + 80,
  likes: Math.floor(Math.random() * 200),
  dislikes: Math.floor(Math.random() * 10),
  saves: Math.floor(Math.random() * 90),
  createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 120).toISOString(),
  ...n,
});

export const SEED_NOTES: Note[] = [];
export const SEED_CONTRIBUTORS: Contributor[] = [];