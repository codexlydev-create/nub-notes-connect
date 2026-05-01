/**
 * Abbreviate a long department name into something compact like "CSE",
 * "EEE", "BBA". Falls back to the first letter of each word.
 */
const SPECIAL: Record<string, string> = {
  "computer science & engineering": "CSE",
  "computer science and engineering": "CSE",
  "computer science": "CS",
  "electrical & electronic engineering": "EEE",
  "electrical and electronic engineering": "EEE",
  "business administration": "BBA",
  "civil engineering": "CE",
  "english": "ENG",
  "law": "LAW",
  "pharmacy": "PHR",
};

export function abbr(name?: string | null) {
  if (!name) return "";
  const lower = name.trim().toLowerCase();
  if (SPECIAL[lower]) return SPECIAL[lower];
  return name
    .split(/\s+/)
    .filter((w) => w && !["of", "the", "and", "&", "in", "for"].includes(w.toLowerCase()))
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
}