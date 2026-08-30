/**
 * Local persistence layer.
 *
 * Deliberately isolated so a future Chrome/Edge extension can swap this module
 * for `chrome.storage.local` without touching hooks, calculators or UI.
 * See src/extension/README.md.
 */

const PREFIX = "vendacalc:";

export const STORAGE_KEYS = {
  settings: `${PREFIX}settings`,
  simulations: `${PREFIX}simulations`,
  products: `${PREFIX}products`,
  draft: `${PREFIX}draft`,
  theme: `${PREFIX}theme`,
} as const;

export function loadValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — calculations keep working */
  }
}

export function removeValue(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
