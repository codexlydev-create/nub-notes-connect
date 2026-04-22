import type { Note, Contributor } from "@/lib/types";
void 0 as unknown as Contributor;

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

export const SEED_NOTES: Note[] = [];
export const SEED_CONTRIBUTORS: Contributor[] = [];