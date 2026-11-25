import express from "express";
import mongoose from "mongoose";
import Suggestion from "../models/Suggestion.js";
import SuggestionReaction from "../models/SuggestionReaction.js";
import { optionalAuth, requireAuth } from "../lib/auth.js";
import {
  suggestionCommentSchema,
  suggestionInputSchema,
  suggestionReactionSchema,
  suggestionUpdateSchema,
} from "../lib/suggestionSchemas.js";
import { isSuggestionOwner, nextReaction } from "../lib/suggestionRules.js";

const router = express.Router();
const isObjectId = (value) => mongoose.isValidObjectId(value);

function formatSuggestion(suggestion, counts = { like: 0, dislike: 0 }, myReaction = null) {
  return {
    ...suggestion.toPublic(),
    likes: counts.like || 0,
    dislikes: counts.dislike || 0,
    myReaction,
  };
}

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const suggestions = await Suggestion.find({}).sort({ createdAt: -1 });
    const ids = suggestions.map((item) => item._id);
    if (!ids.length) return res.json({ items: [] });

    const [counts, mine] = await Promise.all([
      SuggestionReaction.aggregate([
        { $match: { suggestion: { $in: ids } } },
        { $group: { _id: { suggestion: "$suggestion", value: "$value" }, count: { $sum: 1 } } },
      ]),
      req.user
        ? SuggestionReaction.find({ suggestion: { $in: ids }, user: req.user._id }).select("suggestion value")
        : Promise.resolve([]),
    ]);

    const countById = new Map();
    counts.forEach((entry) => {
      const id = entry._id.suggestion.toString();
      const current = countById.get(id) || { like: 0, dislike: 0 };
      current[entry._id.value] = entry.count;
      countById.set(id, current);
    });
    const mineById = new Map(mine.map((reaction) => [reaction.suggestion.toString(), reaction.value]));

    res.json({
      items: suggestions.map((item) => {
        const id = item._id.toString();
        return formatSuggestion(item, countById.get(id), mineById.get(id) || null);
      }),
    });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = suggestionInputSchema.parse(req.body);
    const suggestion = await Suggestion.create({
      ...data,
      authorId: req.user._id,
      authorName: req.user.name,
      authorAvatarUrl: req.user.avatarUrl || "",
    });
    res.status(201).json({ item: formatSuggestion(suggestion) });
  } catch (error) { next(error); }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Invalid suggestion ID" });
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });
    if (!isSuggestionOwner(suggestion.authorId, req.user._id)) {
      return res.status(403).json({ error: "Only the author can edit this suggestion" });
    }
    Object.assign(suggestion, suggestionUpdateSchema.parse(req.body));
    await suggestion.save();
    res.json({ item: formatSuggestion(suggestion) });
  } catch (error) { next(error); }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Invalid suggestion ID" });
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });
    if (!isSuggestionOwner(suggestion.authorId, req.user._id)) {
      return res.status(403).json({ error: "Only the author can delete this suggestion" });
    }
    await Promise.all([
      SuggestionReaction.deleteMany({ suggestion: suggestion._id }),
      suggestion.deleteOne(),
    ]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.post("/:id/reaction", requireAuth, async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Invalid suggestion ID" });
    const { value } = suggestionReactionSchema.parse(req.body);
    const suggestion = await Suggestion.findById(req.params.id).select("_id");
    if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });

    const existing = await SuggestionReaction.findOne({ suggestion: suggestion._id, user: req.user._id });
    const nextValue = nextReaction(existing?.value || null, value);
    if (!nextValue) {
      if (existing) await existing.deleteOne();
    } else if (existing) {
      existing.value = nextValue;
      await existing.save();
    } else {
      try {
        await SuggestionReaction.create({ suggestion: suggestion._id, user: req.user._id, value: nextValue });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        await SuggestionReaction.updateOne(
          { suggestion: suggestion._id, user: req.user._id },
          { $set: { value: nextValue } },
        );
      }
    }

    const [likes, dislikes, current] = await Promise.all([
      SuggestionReaction.countDocuments({ suggestion: suggestion._id, value: "like" }),
      SuggestionReaction.countDocuments({ suggestion: suggestion._id, value: "dislike" }),
      SuggestionReaction.findOne({ suggestion: suggestion._id, user: req.user._id }).select("value"),
    ]);
    res.json({ likes, dislikes, myReaction: current?.value || null });
  } catch (error) { next(error); }
});

router.post("/:id/comments", requireAuth, async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: "Invalid suggestion ID" });
    const data = suggestionCommentSchema.parse(req.body);
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });

    let parentCommentId = null;
    if (data.parentCommentId) {
      const parent = suggestion.comments.id(data.parentCommentId);
      if (!parent || parent.parentCommentId) {
        return res.status(400).json({ error: "Replies must be attached to an existing comment" });
      }
      if (!isSuggestionOwner(suggestion.authorId, req.user._id)) {
        return res.status(403).json({ error: "Only the suggestion author can reply to comments" });
      }
      parentCommentId = parent._id;
    }

    suggestion.comments.push({
      authorId: req.user._id,
      authorName: req.user.name,
      authorAvatarUrl: req.user.avatarUrl || "",
      text: data.text,
      parentCommentId,
    });
    await suggestion.save();
    const savedComment = suggestion.comments[suggestion.comments.length - 1];
    res.status(201).json({
      comment: {
        id: savedComment._id.toString(),
        authorId: savedComment.authorId.toString(),
        authorName: savedComment.authorName,
        authorAvatarUrl: savedComment.authorAvatarUrl || "",
        text: savedComment.text,
        parentCommentId: savedComment.parentCommentId?.toString() || null,
        createdAt: savedComment.createdAt,
      },
    });
  } catch (error) { next(error); }
});

export default router;