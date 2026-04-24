import express from "express";
import { z } from "zod";
import User from "../models/User.js";
import Note from "../models/Note.js";
import { requireAuth } from "../lib/auth.js";

const router = express.Router();

/* Top contributors: aggregate notes by uploader. */
router.get("/contributors", async (_req, res, next) => {
  try {
    const rows = await Note.aggregate([
      {
        $group: {
          _id: "$uploadedBy.id",
          name: { $first: "$uploadedBy.name" },
          uploads: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: "$likes" },
        },
      },
      { $sort: { uploads: -1, totalLikes: -1 } },
      { $limit: 50 },
    ]);
    res.json({
      items: rows.map((r) => ({
        id: r._id?.toString(),
        name: r.name,
        uploads: r.uploads,
        totalViews: r.totalViews,
        totalLikes: r.totalLikes,
      })),
    });
  } catch (e) { next(e); }
});

/* Update own profile. */
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(80).optional(),
      department: z.string().max(100).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
    });
    Object.assign(req.user, schema.parse(req.body));
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (e) { next(e); }
});

export default router;