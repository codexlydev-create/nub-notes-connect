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

export const suggestionFormSchema = z.object({
  topic: z.string().trim().min(1, "Topic is required").max(120),
  field: z.string().trim().min(1, "Field is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(4000),
}).strict();

export const suggestionCommentSchema = z.object({
  text: z.string().trim().min(1, "Comment is required").max(2000),
});

export type SuggestionFormValues = z.infer<typeof suggestionFormSchema>;