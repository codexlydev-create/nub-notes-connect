export function isSuggestionOwner(authorId, userId) {
  return Boolean(authorId && userId && String(authorId) === String(userId));
}

export function nextReaction(currentValue, requestedValue) {
  return currentValue === requestedValue ? null : requestedValue;
}