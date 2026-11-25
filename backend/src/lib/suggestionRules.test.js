import test from "node:test";
import assert from "node:assert/strict";
import {
  publicContactSchema,
  suggestionCommentSchema,
  suggestionInputSchema,
} from "./suggestionSchemas.js";
import { isSuggestionOwner, nextReaction } from "./suggestionRules.js";

test("public contact requires a safe HTTP or HTTPS URL", () => {
  assert.equal(publicContactSchema.safeParse({
    platformName: "Portfolio",
    platformUrl: "https://example.com/rifat",
  }).success, true);
  assert.equal(publicContactSchema.safeParse({
    platformName: "Portfolio",
    platformUrl: "javascript:alert(1)",
  }).success, false);
});

test("suggestions require topic, field, and a non-empty description", () => {
  assert.equal(suggestionInputSchema.safeParse({
    topic: "Library hours",
    field: "Campus facilities",
    description: "Please extend the evening schedule.",
  }).success, true);
  assert.equal(suggestionInputSchema.safeParse({
    topic: "",
    field: "Campus facilities",
    description: "Please extend the evening schedule.",
  }).success, false);
});

test("only the suggestion author can manage or reply to their post", () => {
  assert.equal(isSuggestionOwner("user-a", "user-a"), true);
  assert.equal(isSuggestionOwner("user-a", "user-b"), false);
});

test("reaction selection toggles the same vote off and switches opposite votes", () => {
  assert.equal(nextReaction(null, "like"), "like");
  assert.equal(nextReaction("like", "like"), null);
  assert.equal(nextReaction("like", "dislike"), "dislike");
});