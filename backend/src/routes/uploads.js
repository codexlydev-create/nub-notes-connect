import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { requireAuth } from "../lib/auth.js";
import Note from "../models/Note.js";
import {
  presignPutUrl,
  publicUrlFor,
  getObjectBuffer,
  putObjectBuffer,
} from "../lib/r2.js";
import { watermarkPdfBuffer } from "../lib/watermark.js";
import { convertPptxBufferToPdf } from "../lib/pptxConvert.js";
import { deleteObject } from "../lib/r2.js";

const router = express.Router();
const MAX_BYTES = 50 * 1024 * 1024; // 50MB
const AVATAR_MAX_BYTES = 1 * 1024 * 1024; // 1MB
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PPTX_MIMES = new Set([
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
]);
const ALLOWED_UPLOAD_MIMES = new Set(["application/pdf", ...PPTX_MIMES]);

/**
 * POST /api/uploads/generate-upload-url
 * Body: { fileName, fileType, fileSize? }
 * Returns: { uploadUrl, fileUrl, key, expiresIn }
 */
router.post("/generate-upload-url", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      fileName: z.string().min(1).max(255),
      fileType: z.string().refine((t) => ALLOWED_UPLOAD_MIMES.has(t), {
        message: "Only PDF or PPTX files are allowed",
      }),
      fileSize: z.coerce.number().int().positive().max(MAX_BYTES).optional(),
    });
    const { fileName, fileType } = schema.parse(req.body);

    const safeBase = path
      .basename(fileName)
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 120);
    const ext = path.extname(safeBase).toLowerCase() || ".pdf";
    const stem = path.basename(safeBase, ext) || "note";
    const key = `notes/${req.user._id.toString()}/${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}-${stem}${ext}`;

    const uploadUrl = await presignPutUrl(key, fileType, 300);
    const fileUrl = publicUrlFor(key);
    res.json({ uploadUrl, fileUrl, key, expiresIn: 300 });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/uploads/avatar-upload-url
 * Body: { fileName, fileType, fileSize? }
 * Returns: { uploadUrl, fileUrl, key, expiresIn }
 */
router.post("/avatar-upload-url", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      fileName: z.string().min(1).max(255),
      fileType: z.string().refine((t) => AVATAR_TYPES.has(t), {
        message: "Only JPG, PNG or WebP images are allowed",
      }),
      fileSize: z.coerce.number().int().positive().max(AVATAR_MAX_BYTES).optional(),
    });
    const { fileName, fileType } = schema.parse(req.body);
    const safeBase = path
      .basename(fileName)
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 80);
    const ext = path.extname(safeBase).toLowerCase() || ".jpg";
    const key = `avatars/${req.user._id.toString()}/${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")}${ext}`;
    const uploadUrl = await presignPutUrl(key, fileType, 300);
    const fileUrl = publicUrlFor(key);
    res.json({ uploadUrl, fileUrl, key, expiresIn: 300 });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/uploads/save-file
 * Persists note metadata after the file is uploaded directly to R2.
 * Server-side: downloads the raw PDF, stamps a per-uploader watermark on every
 * page, and re-uploads to R2 so every preview/download is permanently watermarked.
 */
router.post("/save-file", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).default(""),
      department: z.string().min(1).max(100),
      course: z.string().min(1).max(150),
      courseCode: z.string().min(1).max(40),
      type: z.enum(["Slide", "Hand Notes"]),
      fileName: z.string().min(1).max(255),
      fileUrl: z.string().url(),
      fileSize: z.coerce.number().int().nonnegative().max(MAX_BYTES).default(0),
      fileKey: z.string().max(512).optional(),
      pageCount: z.coerce.number().int().nonnegative().default(0),
    });
    const data = schema.parse(req.body);

    let finalUrl = data.fileUrl;
    let finalKey = data.fileKey || "";
    let finalSize = data.fileSize;
    let finalPageCount = data.pageCount;
    let finalFileName = data.fileName;

    // If the uploaded file is a PPTX, convert it to PDF (via LibreOffice)
    // before the watermark step so the rest of the pipeline (preview,
    // download, watermark) is identical to the PDF flow.
    const lower = (finalKey || finalFileName).toLowerCase();
    const isPptx = lower.endsWith(".pptx") || lower.endsWith(".ppt");
    if (isPptx && finalKey) {
      try {
        const raw = await getObjectBuffer(finalKey);
        const pdfBuffer = await convertPptxBufferToPdf(raw);
        const newKey = finalKey.replace(/\.pptx?$/i, ".pdf");
        await putObjectBuffer(newKey, pdfBuffer, "application/pdf");
        if (newKey !== finalKey) {
          deleteObject(finalKey).catch(() => {});
        }
        finalKey = newKey;
        finalUrl = publicUrlFor(newKey);
        finalFileName = finalFileName.replace(/\.pptx?$/i, ".pdf");
        finalSize = pdfBuffer.length;
      } catch (err) {
        console.error("pptx -> pdf conversion failed", err?.message || err);
        return res.status(500).json({ error: "Failed to convert PPTX to PDF" });
      }
    }

    // Watermark the PDF in place using the original key.
    if (finalKey) {
      try {
        const raw = await getObjectBuffer(finalKey);
        const { buffer: stamped, pageCount } = await watermarkPdfBuffer(raw, {
          uploaderName: req.user.name,
          siteUrl: "diunotes.com",
        });
        await putObjectBuffer(finalKey, stamped, "application/pdf");
        finalSize = stamped.length;
        finalPageCount = pageCount;
      } catch (err) {
        // If watermarking fails, fall back to the original file but log it.
        console.error("watermarkPdfBuffer failed", err?.message || err);
      }
    }

    const note = await Note.create({
      title: data.title,
      description: data.description,
      department: data.department,
      course: data.course,
      courseCode: data.courseCode,
      type: data.type,
      fileName: finalFileName,
      fileMime: "application/pdf",
      fileSize: finalSize,
      fileUrl: finalUrl,
      fileKey: finalKey,
      pageCount: finalPageCount,
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

export default router;