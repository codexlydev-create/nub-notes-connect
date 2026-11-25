import { z } from "zod";

const httpUrlSchema = z.string().trim().url().max(2048).refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "Use an http or https link");

export const publicContactSchema = z.object({
  platformName: z.string().trim().min(1, "Platform name is required").max(60),
  platformUrl: httpUrlSchema,
}).strict();

export const suggestionInputSchema = z.object({
  topic: z.string().trim().min(1, "Topic is required").max(120),
  field: z.string().trim().min(1, "Field is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(4000),
}).strict();

export const suggestionUpdateSchema = suggestionInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Add at least one field to update",
);

export const suggestionCommentSchema = z.object({
  text: z.string().trim().min(1, "Comment is required").max(2000),
  parentCommentId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).strict();

export const suggestionReactionSchema = z.object({
  value: z.enum(["like", "dislike"]),
}).strict();