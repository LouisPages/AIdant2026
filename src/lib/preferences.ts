import type { UserPreferences } from "@/lib/types";

/** Valeurs par défaut : tout reste ouvert, sauf le filtrage du fil qui demande un choix volontaire. */
export const DEFAULT_PREFERENCES: UserPreferences = {
  contactRequests: true,
  peopleSuggestions: true,
  aiSuggestions: true,
  onlyMyCircles: false,
};

export const PREFERENCE_KEYS = Object.keys(DEFAULT_PREFERENCES) as (keyof UserPreferences)[];

/** Complète des préférences partielles ou inconnues (ancienne fiche, valeur invalide) avec les valeurs par défaut. */
export function normalizePreferences(value: unknown): UserPreferences {
  const raw = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const out = { ...DEFAULT_PREFERENCES };
  for (const key of PREFERENCE_KEYS) {
    if (typeof raw[key] === "boolean") out[key] = raw[key];
  }
  return out;
}
