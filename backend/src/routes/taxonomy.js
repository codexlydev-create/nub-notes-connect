import express from "express";
import { z } from "zod";
import Taxonomy from "../models/Taxonomy.js";
import Note from "../models/Note.js";
import { requireAuth } from "../lib/auth.js";

const router = express.Router();

/** Built-in seed taxonomy — kept in sync with the frontend defaults. */
const SEED_DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Business Administration",
  "English",
  "Law",
  "Pharmacy",
  "Civil Engineering",
];

const SEED_COURSES = {
  "Computer Science & Engineering": [
    "Data Structures", "Algorithms", "Operating Systems",
    "Database Systems", "Computer Networks", "Software Engineering",
  ],
  "Electrical & Electronic Engineering": [
    "Circuit Analysis", "Digital Logic", "Signals & Systems", "Power Electronics",
  ],
  "Business Administration": [
    "Principles of Management", "Financial Accounting", "Marketing", "Microeconomics",
  ],
  English: ["Linguistics", "Modern Poetry", "Shakespeare", "Academic Writing"],
  Law: ["Constitutional Law", "Contract Law", "Criminal Law"],
  Pharmacy: ["Pharmacology I", "Medicinal Chemistry", "Pharmaceutics"],
  "Civil Engineering": ["Structural Analysis", "Geotechnical Eng.", "Fluid Mechanics"],
};

function uniq(arr) { return Array.from(new Set(arr.filter(Boolean))); }

/** GET /api/taxonomy — returns merged seed + custom + in-use values. */
router.get("/", async (_req, res, next) => {
  try {
    const [custom, usedDept, usedCourse] = await Promise.all([
      Taxonomy.find({}).lean(),
      Note.distinct("department"),
      Note.aggregate([{ $group: { _id: { dept: "$department", course: "$course" } } }]),
    ]);

    const departments = uniq([
      ...SEED_DEPARTMENTS,
      ...custom.filter((c) => c.kind === "department").map((c) => c.name),
      ...usedDept,
    ]).sort();

    const coursesByDept = {};
    for (const d of departments) coursesByDept[d] = [...(SEED_COURSES[d] || [])];
    for (const c of custom.filter((c) => c.kind === "course")) {
      if (!coursesByDept[c.parent]) coursesByDept[c.parent] = [];
      coursesByDept[c.parent].push(c.name);
    }
    for (const row of usedCourse) {
      const { dept, course } = row._id || {};
      if (!dept || !course) continue;
      if (!coursesByDept[dept]) coursesByDept[dept] = [];
      coursesByDept[dept].push(course);
    }
    for (const k of Object.keys(coursesByDept)) {
      coursesByDept[k] = uniq(coursesByDept[k]).sort();
    }

    res.json({ departments, coursesByDept });
  } catch (e) { next(e); }
});

/** POST /api/taxonomy — auth-only; adds a custom department or course. */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      kind: z.enum(["department", "course"]),
      name: z.string().trim().min(1).max(120),
      parent: z.string().trim().max(120).optional().default(""),
    });
    const data = schema.parse(req.body);
    if (data.kind === "course" && !data.parent) {
      return res.status(400).json({ error: "parent department is required for a course" });
    }
    await Taxonomy.updateOne(
      { kind: data.kind, name: data.name, parent: data.kind === "course" ? data.parent : "" },
      { $setOnInsert: { kind: data.kind, name: data.name, parent: data.kind === "course" ? data.parent : "" } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;