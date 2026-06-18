export const CATEGORIES = [
  { value: "creative",  label: "Kreativ",   icon: "🎨", color: "var(--cat-creative)" },
  { value: "active",    label: "Aktiv",     icon: "⚡", color: "var(--cat-active)" },
  { value: "friendly",  label: "Sozial",    icon: "🤝", color: "var(--cat-friendly)" },
  { value: "skill",     label: "Skill",     icon: "🎯", color: "var(--cat-skill)" },
  { value: "learning",  label: "Lernen",    icon: "📚", color: "var(--cat-learning)" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function categoryMeta(v: string) {
  return CATEGORIES.find((c) => c.value === v) ?? CATEGORIES[0];
}

export const STICKERS = ["🔥", "💯", "😮", "👏", "🫡"] as const;
