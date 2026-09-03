/**
 * Store (workspace) registry + per-store storage namespacing.
 *
 * Every entity lives under a key scoped to its store:
 *   vendacalc:store:<storeId>:products
 * This keeps the local layer trivially portable to a future backend where
 * `storeId` becomes a real column (Supabase) instead of a key prefix.
 */

import type { AppSettings, SavedProduct, SavedSimulation, Store, StoreRegistry } from "@/types";
import { DEFAULT_SETTINGS, createEmptyInput } from "@/calculators/defaults";
import { STORAGE_KEYS, loadValue, removeValue, saveValue } from "./storage";
import { uid } from "@/utils/format";

const REGISTRY_KEY = "vendacalc:stores";

export const STORE_ICONS = ["🏪", "📦", "🎮", "👕", "💻", "🛒", "💄", "🍔", "⚙️"] as const;

export type StoreEntity = "settings" | "simulations" | "products" | "draft";

export function storeKey(storeId: string, entity: StoreEntity): string {
  return `vendacalc:store:${storeId}:${entity}`;
}

export function createStore(name: string, icon: string): Store {
  return {
    id: uid(),
    name: name.trim() || "Nova loja",
    icon: icon || "🏪",
    createdAt: new Date().toISOString(),
  };
}

function seedStoreData(storeId: string, settings: AppSettings) {
  saveValue(storeKey(storeId, "settings"), settings);
  saveValue<SavedSimulation[]>(storeKey(storeId, "simulations"), []);
  saveValue<SavedProduct[]>(storeKey(storeId, "products"), []);
  saveValue(storeKey(storeId, "draft"), createEmptyInput());
}

/**
 * Loads the registry, creating the default store on first run and migrating
 * any pre-stores data (legacy global keys) into it. Never destructive.
 */
export function ensureRegistry(): StoreRegistry {
  const existing = loadValue<StoreRegistry | null>(REGISTRY_KEY, null);
  if (existing && existing.stores.length > 0) {
    const activeStoreId = existing.stores.some((s) => s.id === existing.activeStoreId)
      ? existing.activeStoreId
      : existing.stores[0]!.id;
    return { stores: existing.stores, activeStoreId };
  }

  const store = createStore("Minha Loja", "🏪");
  const legacySettings = loadValue<AppSettings | null>(STORAGE_KEYS.settings, null);
  const legacySims = loadValue<SavedSimulation[]>(STORAGE_KEYS.simulations, []);
  const legacyProducts = loadValue<SavedProduct[]>(STORAGE_KEYS.products, []);
  const legacyDraft = loadValue(STORAGE_KEYS.draft, createEmptyInput());

  seedStoreData(store.id, legacySettings ?? DEFAULT_SETTINGS);
  saveValue(
    storeKey(store.id, "simulations"),
    legacySims.map((s) => ({ ...s, storeId: store.id })),
  );
  saveValue(
    storeKey(store.id, "products"),
    legacyProducts.map((p) => ({ ...p, storeId: store.id })),
  );
  saveValue(storeKey(store.id, "draft"), legacyDraft);

  const registry: StoreRegistry = { stores: [store], activeStoreId: store.id };
  saveRegistry(registry);
  return registry;
}

export function saveRegistry(registry: StoreRegistry): void {
  saveValue(REGISTRY_KEY, registry);
}

export function initStoreData(storeId: string): void {
  seedStoreData(storeId, DEFAULT_SETTINGS);
}

export function duplicateStoreData(
  fromId: string,
  toId: string,
  includeData: boolean,
): void {
  const settings = loadValue<AppSettings>(storeKey(fromId, "settings"), DEFAULT_SETTINGS);
  saveValue(storeKey(toId, "settings"), settings);
  saveValue(storeKey(toId, "draft"), createEmptyInput());

  if (!includeData) {
    saveValue<SavedSimulation[]>(storeKey(toId, "simulations"), []);
    saveValue<SavedProduct[]>(storeKey(toId, "products"), []);
    return;
  }

  const sims = loadValue<SavedSimulation[]>(storeKey(fromId, "simulations"), []);
  const products = loadValue<SavedProduct[]>(storeKey(fromId, "products"), []);
  saveValue(
    storeKey(toId, "simulations"),
    sims.map((s) => ({ ...s, id: uid(), storeId: toId })),
  );
  saveValue(
    storeKey(toId, "products"),
    products.map((p) => ({ ...p, id: uid(), storeId: toId })),
  );
}

export function purgeStoreData(storeId: string): void {
  (["settings", "simulations", "products", "draft"] as StoreEntity[]).forEach((entity) =>
    removeValue(storeKey(storeId, entity)),
  );
}

export function countStoreData(storeId: string): { products: number; simulations: number } {
  return {
    products: loadValue<SavedProduct[]>(storeKey(storeId, "products"), []).length,
    simulations: loadValue<SavedSimulation[]>(storeKey(storeId, "simulations"), []).length,
  };
}
