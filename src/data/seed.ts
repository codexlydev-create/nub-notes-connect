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

export const SEED_NOTES: Note[] = [
  mkNote({ id: "n1", title: "Binary Trees — Complete Walkthrough", type: "Slide", courseCode: "CSE 2101", course: "Data Structures" }),
  mkNote({ id: "n2", title: "Dijkstra & Shortest Paths", type: "Hand Notes", courseCode: "CSE 3103", course: "Algorithms", uploadedBy: "Rafiq Islam", uploadedById: "u2" }),
  mkNote({ id: "n3", title: "Process Scheduling Cheat Sheet", type: "Slide", courseCode: "CSE 3201", course: "Operating Systems", uploadedBy: "Mitu Saha", uploadedById: "u3" }),
  mkNote({ id: "n4", title: "Normalization & ER Diagrams", type: "Hand Notes", courseCode: "CSE 3301", course: "Database Systems" }),
  mkNote({ id: "n5", title: "OSI vs TCP/IP — Visual Notes", type: "Slide", courseCode: "CSE 3401", course: "Computer Networks", uploadedBy: "Rafiq Islam", uploadedById: "u2" }),
  mkNote({ id: "n6", title: "Agile & Scrum Essentials", type: "Slide", courseCode: "CSE 4101", course: "Software Engineering", uploadedBy: "Nabila Khan", uploadedById: "u4" }),
  mkNote({ id: "n7", title: "Thevenin & Norton Theorems", type: "Hand Notes", courseCode: "EEE 2101", course: "Circuit Analysis", department: "Electrical & Electronic Engineering", uploadedBy: "Tanvir Ahmed", uploadedById: "u5" }),
  mkNote({ id: "n8", title: "Karnaugh Maps Mastery", type: "Slide", courseCode: "EEE 2203", course: "Digital Logic", department: "Electrical & Electronic Engineering" }),
  mkNote({ id: "n9", title: "Marketing Mix — 4Ps Explained", type: "Slide", courseCode: "BBA 2202", course: "Marketing", department: "Business Administration", uploadedBy: "Sadia Noor", uploadedById: "u6" }),
  mkNote({ id: "n10", title: "Supply & Demand Deep Dive", type: "Hand Notes", courseCode: "BBA 2104", course: "Microeconomics", department: "Business Administration" }),
  mkNote({ id: "n11", title: "Shakespearean Sonnets Analysis", type: "Hand Notes", courseCode: "ENG 3102", course: "Shakespeare", department: "English", uploadedBy: "Mitu Saha", uploadedById: "u3" }),
  mkNote({ id: "n12", title: "Contract Law — Key Cases", type: "Slide", courseCode: "LAW 2203", course: "Contract Law", department: "Law" }),
];

export const SEED_CONTRIBUTORS: Contributor[] = [
  { id: "u1", name: "Ayesha Rahman", email: "ayesha@nub.edu", studentId: "NUB-CSE-2001", role: "Active Uploader", notesCount: 24, views: 12430, likes: 892, rank: 1 },
  { id: "u2", name: "Rafiq Islam", email: "rafiq@nub.edu", studentId: "NUB-CSE-1987", role: "Active Uploader", notesCount: 19, views: 9820, likes: 714, rank: 2 },
  { id: "u3", name: "Mitu Saha", email: "mitu@nub.edu", studentId: "NUB-ENG-2112", role: "Contributor", notesCount: 15, views: 7560, likes: 540, rank: 3 },
  { id: "u4", name: "Nabila Khan", email: "nabila@nub.edu", studentId: "NUB-CSE-2210", role: "Contributor", notesCount: 12, views: 6100, likes: 410, rank: 4 },
  { id: "u5", name: "Tanvir Ahmed", email: "tanvir@nub.edu", studentId: "NUB-EEE-2033", role: "Contributor", notesCount: 10, views: 5220, likes: 378, rank: 5 },
  { id: "u6", name: "Sadia Noor", email: "sadia@nub.edu", studentId: "NUB-BBA-2401", role: "Contributor", notesCount: 8, views: 3980, likes: 261, rank: 6 },
  { id: "u7", name: "Imran Hossain", email: "imran@nub.edu", studentId: "NUB-CSE-2305", role: "Contributor", notesCount: 6, views: 2740, likes: 188, rank: 7 },
  { id: "u8", name: "Lamia Chowdhury", email: "lamia@nub.edu", studentId: "NUB-LAW-2150", role: "Contributor", notesCount: 5, views: 1960, likes: 132, rank: 8 },
];