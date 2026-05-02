import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Note from "../models/Note.js";
import Interaction from "../models/Interaction.js";
import View from "../models/View.js";
import { requireAuth, optionalAuth } from "../lib/auth.js";
import multer from "multer";
import { putObjectBuffer, publicUrlFor, deleteObject } from "../lib/r2.js";
import crypto from "node:crypto";

const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 50);
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only PDF files are allowed"));
  },
});

const router = express.Router();
const isObjectId = (s) => mongoose.isValidObjectId(s);

/* -------- list (public) -------- */
router.get("/", async (req, res, next) => {
  try {
    const { department, course, type, q, courseCode } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const filter = {};
    if (department) filter.department = department;
    if (course) filter.course = course;
    if (type) filter.type = type;
    if (courseCode) filter.courseCode = new RegExp(escapeRegex(String(courseCode)), "i");
    if (q) filter.title = new RegExp(escapeRegex(String(q)), "i");
    if (req.query.studentId) filter["uploadedBy.studentId"] = new RegExp(escapeRegex(String(req.query.studentId)), "i");
    const [items, total] = await Promise.all([
      Note.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Note.countDocuments(filter),
    ]);
    res.json({ items: items.map((n) => n.toPublic()), total, page, limit });
  } catch (e) { next(e); }
});

/* -------- single (public, increments view per viewer) -------- */
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Bad id" });
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const viewerKey = req.user?._id?.toString() || `anon:${req.ip}`;
    try {
      await View.create({ viewerKey, note: note._id });
      note.views += 1;
      await note.save();
    } catch { /* duplicate view → ignore */ }

    let interaction = null;
    if (req.user) {
      interaction = await Interaction.findOne({ user: req.user._id, note: note._id });
    }
    res.json({
      note: note.toPublic(),
      me: interaction ? { liked: interaction.liked, disliked: interaction.disliked, saved: interaction.saved } : null,
    });
  } catch (e) { next(e); }
});

/* -------- stream PDF -------- */
router.get("/:id/file", async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Bad id" });
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "File not found" });
    if (note.fileUrl) return res.redirect(302, note.fileUrl);
    return res.status(404).json({ error: "File not found" });
  } catch (e) { next(e); }
});

/* -------- create -------- */
router.post("/", requireAuth, uploadPdf.single("file"), async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).default(""),
      department: z.string().min(1).max(100),
      course: z.string().min(1).max(150),
      courseCode: z.string().min(1).max(40),
      type: z.enum(["Slide", "Hand Notes"]),
      pageCount: z.coerce.number().int().nonnegative().default(0),
    });
    const data = schema.parse(req.body);
    if (!req.file) return res.status(400).json({ error: "PDF file required" });
    const safeBase = (req.file.originalname || "note.pdf")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 120);
    const key = `notes/${req.user._id.toString()}/${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}-${safeBase}`;
    await putObjectBuffer(key, req.file.buffer, "application/pdf");
    const note = await Note.create({
      ...data,
      fileName: req.file.originalname,
      fileMime: req.file.mimetype,
      fileSize: req.file.size,
      fileKey: key,
      fileUrl: publicUrlFor(key),
      uploadedBy: {
        id: req.user._id,
        name: req.user.name,
        studentId: req.user.studentId || "",
        department: req.user.department || "",
        avatarUrl: req.user.avatarUrl || "",
      },
    });
    res.status(201).json({ note: note.toPublic() });
  } catch (e) {
    next(e);
  }
});

/* -------- update (owner) -------- */
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Bad id" });
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.uploadedBy.id.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Not your note" });
    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      department: z.string().min(1).max(100).optional(),
      course: z.string().min(1).max(150).optional(),
      courseCode: z.string().min(1).max(40).optional(),
      type: z.enum(["Slide", "Hand Notes"]).optional(),
    });
    Object.assign(note, schema.parse(req.body));
    await note.save();
    res.json({ note: note.toPublic() });
  } catch (e) { next(e); }
});

/* -------- delete (owner) -------- */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Bad id" });
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.uploadedBy.id.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Not your note" });
    if (note.fileKey) {
      // fire-and-forget R2 delete
      deleteObject(note.fileKey).catch(() => {});
    }
    await Promise.all([
      Interaction.deleteMany({ note: note._id }),
      View.deleteMany({ note: note._id }),
      note.deleteOne(),
    ]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* -------- toggle like / dislike / save -------- */
function toggleHandler(field) {
  return async (req, res, next) => {
    try {
      if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Bad id" });
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ error: "Note not found" });
      if (note.uploadedBy.id.toString() === req.user._id.toString())
        return res.status(400).json({ error: "You can't react to your own note" });
      const inter = await Interaction.findOneAndUpdate(
        { user: req.user._id, note: note._id },
        { $setOnInsert: { user: req.user._id, note: note._id } },
        { new: true, upsert: true }
      );
      const wasOn = inter[field];
      inter[field] = !wasOn;

      // like and dislike are mutually exclusive
      if (field === "liked" && inter.liked && inter.disliked) {
        inter.disliked = false;
        note.dislikes = Math.max(0, note.dislikes - 1);
      }
      if (field === "disliked" && inter.disliked && inter.liked) {
        inter.liked = false;
        note.likes = Math.max(0, note.likes - 1);
      }

      const counterMap = { liked: "likes", disliked: "dislikes", saved: "saves" };
      note[counterMap[field]] = Math.max(0, note[counterMap[field]] + (wasOn ? -1 : 1));
      await Promise.all([inter.save(), note.save()]);
      res.json({
        note: note.toPublic(),
        me: { liked: inter.liked, disliked: inter.disliked, saved: inter.saved },
      });
    } catch (e) { next(e); }
  };
}
router.post("/:id/like", requireAuth, toggleHandler("liked"));
router.post("/:id/dislike", requireAuth, toggleHandler("disliked"));
router.post("/:id/save", requireAuth, toggleHandler("saved"));

/* -------- my uploads -------- */
router.get("/me/uploads", requireAuth, async (req, res, next) => {
  try {
    const items = await Note.find({ "uploadedBy.id": req.user._id }).sort({ createdAt: -1 });
    res.json({ items: items.map((n) => n.toPublic()) });
  } catch (e) { next(e); }
});

/* -------- my saved -------- */
router.get("/me/saved", requireAuth, async (req, res, next) => {
  try {
    const inters = await Interaction.find({ user: req.user._id, saved: true }).sort({ updatedAt: -1 });
    const ids = inters.map((i) => i.note);
    const notes = await Note.find({ _id: { $in: ids } });
    const byId = new Map(notes.map((n) => [n._id.toString(), n.toPublic()]));
    res.json({ items: ids.map((id) => byId.get(id.toString())).filter(Boolean) });
  } catch (e) { next(e); }
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default router;