export const locales = ["de", "en"] as const;

export type Locale = (typeof locales)[number];
