import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";
import Note from "../models/Note.js";
import { requireAuth } from "../lib/auth.js";
import { publicContactSchema } from "../lib/suggestionSchemas.js";

const router = express.Router();

/* Top contributors: aggregate notes by uploader. */
router.get("/contributors", async (_req, res, next) => {
  try {
    const rows = await Note.aggregate([
      {
        $group: {
          _id: "$uploadedBy.id",
          name: { $first: "$uploadedBy.name" },
          studentId: { $first: "$uploadedBy.studentId" },
          department: { $first: "$uploadedBy.department" },
          avatarUrl: { $first: "$uploadedBy.avatarUrl" },
          uploads: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: "$likes" },
          totalDislikes: { $sum: "$dislikes" },
        },
      },
      { $sort: { uploads: -1, totalLikes: -1 } },
      { $limit: 50 },
    ]);
    // Always overlay the live User profile so changes (avatar, name, dept)
    // are reflected immediately, regardless of stale snapshots on notes.
    const ids = rows.map((r) => r._id).filter(Boolean);
    if (ids.length) {
      const users = await User.find({ _id: { $in: ids } }).select(
        "_id name studentId department avatarUrl publicContact"
      );
      const map = new Map(users.map((u) => [u._id.toString(), u]));
      rows.forEach((r) => {
        if (!r._id) return;
        const u = map.get(r._id.toString());
        if (!u) return;
        r.name = u.name || r.name;
        r.studentId = u.studentId || r.studentId || "";
        r.department = u.department || r.department || "";
        r.avatarUrl = u.avatarUrl ?? "";
        r.publicContact = u.publicContact?.platformName && u.publicContact?.platformUrl
          ? { platformName: u.publicContact.platformName, platformUrl: u.publicContact.platformUrl }
          : null;
      });
    }
    res.json({
      items: rows.map((r) => ({
        id: r._id?.toString(),
        name: r.name,
        studentId: r.studentId || "",
        department: r.department || "",
        avatarUrl: r.avatarUrl || "",
        publicContact: r.publicContact || null,
        uploads: r.uploads,
        totalViews: r.totalViews,
        totalLikes: r.totalLikes,
        totalDislikes: r.totalDislikes || 0,
      })),
    });
  } catch (e) { next(e); }
});

/* Update own profile. */
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(80).optional(),
      studentId: z.string().min(2).max(40).optional(),
      department: z.string().max(100).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
      avatarKey: z.string().max(512).optional().or(z.literal("")),
      publicContact: publicContactSchema.nullable().optional(),
    });
    const patch = schema.parse(req.body);
    Object.assign(req.user, patch);
    await req.user.save();
    // Propagate identity changes to the snapshot stored on every note the
    // user has uploaded, so cards across the app reflect the latest avatar,
    // name, student ID, and department.
    const noteUpdate = {};
    if (patch.avatarUrl !== undefined) noteUpdate["uploadedBy.avatarUrl"] = patch.avatarUrl;
    if (patch.name !== undefined) noteUpdate["uploadedBy.name"] = patch.name;
    if (patch.studentId !== undefined) noteUpdate["uploadedBy.studentId"] = patch.studentId;
    if (patch.department !== undefined) noteUpdate["uploadedBy.department"] = patch.department;
    if (Object.keys(noteUpdate).length) {
      Note.updateMany({ "uploadedBy.id": req.user._id }, { $set: noteUpdate }).catch(() => {});
    }
    res.json({ user: req.user.toPublic() });
  } catch (e) { next(e); }
});

/* Delete avatar */
router.delete("/me/avatar", requireAuth, async (req, res, next) => {
  try {
    req.user.avatarUrl = "";
    req.user.avatarKey = "";
    await req.user.save();
    // Clear the avatar snapshot on all notes uploaded by this user.
    Note.updateMany(
      { "uploadedBy.id": req.user._id },
      { $set: { "uploadedBy.avatarUrl": "" } }
    ).catch(() => {});
    res.json({ user: req.user.toPublic() });
  } catch (e) { next(e); }
});

export default router;