import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { AppSettings, CalcInput, SavedProduct, SavedSimulation, Store } from "@/types";
import { DEFAULT_SETTINGS, createEmptyInput } from "@/calculators/defaults";
import { calculateProfit } from "@/calculators/profit";
import {
  countStoreData,
  createStore as buildStore,
  duplicateStoreData,
  ensureRegistry,
  initStoreData,
  purgeStoreData,
  saveRegistry,
  storeKey,
} from "@/services/stores";
import { uid } from "@/utils/format";
import { usePersistentState } from "./usePersistentState";

const PENDING = "__pending__";

interface VendaCalcContextValue {
  /* stores */
  stores: Store[];
  activeStore: Store | null;
  activeStoreId: string;
  setActiveStore: (id: string) => void;
  addStore: (name: string, icon: string) => void;
  updateStore: (id: string, patch: Partial<Pick<Store, "name" | "icon">>) => void;
  duplicateStore: (id: string, includeData: boolean) => void;
  deleteStore: (id: string) => void;
  storeStats: (id: string) => { products: number; simulations: number };

  settings: AppSettings;
  setSettings: (updater: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  draft: CalcInput;
  setDraft: (updater: CalcInput | ((prev: CalcInput) => CalcInput)) => void;
  patchDraft: (patch: Partial<CalcInput>) => void;
  simulations: SavedSimulation[];
  saveSimulation: (input: CalcInput) => void;
  removeSimulation: (id: string) => void;
  duplicateSimulation: (id: string) => void;
  products: SavedProduct[];
  saveProduct: (input: CalcInput) => void;
  removeProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
  hydrated: boolean;
}

const VendaCalcContext = createContext<VendaCalcContextValue | null>(null);

export function VendaCalcProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>(PENDING);
  const ready = activeStoreId !== PENDING;

  useEffect(() => {
    const registry = ensureRegistry();
    setStores(registry.stores);
    setActiveStoreId(registry.activeStoreId);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveRegistry({ stores, activeStoreId });
  }, [stores, activeStoreId, ready]);

  const scoped = (entity: Parameters<typeof storeKey>[1]) =>
    ready ? storeKey(activeStoreId, entity) : `${PENDING}:${entity}`;

  const settingsStore = usePersistentState<AppSettings>(
    scoped("settings"),
    DEFAULT_SETTINGS,
    ready,
  );
  const draftStore = usePersistentState<CalcInput>(scoped("draft"), createEmptyInput(), ready);
  const simStore = usePersistentState<SavedSimulation[]>(scoped("simulations"), [], ready);
  const productStore = usePersistentState<SavedProduct[]>(scoped("products"), [], ready);

  /* ---------------- store management ---------------- */

  const setActiveStore = useCallback(
    (id: string) => {
      setActiveStoreId((prev) => {
        if (prev === id) return prev;
        const found = stores.find((s) => s.id === id);
        if (found) toast.success(`Agora você está visualizando: ${found.icon} ${found.name}`);
        return id;
      });
    },
    [stores],
  );

  const addStore = useCallback((name: string, icon: string) => {
    const store = buildStore(name, icon);
    initStoreData(store.id);
    setStores((prev) => [...prev, store]);
    setActiveStoreId(store.id);
    toast.success(`Loja criada: ${store.icon} ${store.name}`);
  }, []);

  const updateStore = useCallback(
    (id: string, patch: Partial<Pick<Store, "name" | "icon">>) =>
      setStores((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    [],
  );

  const duplicateStore = useCallback(
    (id: string, includeData: boolean) => {
      const source = stores.find((s) => s.id === id);
      if (!source) return;
      const copy = buildStore(`${source.name} (cópia)`, source.icon);
      duplicateStoreData(id, copy.id, includeData);
      setStores((prev) => [...prev, copy]);
      toast.success(`Loja duplicada: ${copy.icon} ${copy.name}`);
    },
    [stores],
  );

  const deleteStore = useCallback(
    (id: string) => {
      if (stores.length <= 1) {
        toast.error("Não é possível excluir a última loja.");
        return;
      }
      purgeStoreData(id);
      const remaining = stores.filter((s) => s.id !== id);
      setStores(remaining);
      if (activeStoreId === id) setActiveStoreId(remaining[0]!.id);
      toast.success("Loja excluída.");
    },
    [stores, activeStoreId],
  );

  const storeStats = useCallback(
    (id: string) => {
      if (id === activeStoreId) {
        return { products: productStore.value.length, simulations: simStore.value.length };
      }
      return countStoreData(id);
    },
    [activeStoreId, productStore.value.length, simStore.value.length],
  );

  /* ---------------- scoped entities ---------------- */

  const patchDraft = useCallback(
    (patch: Partial<CalcInput>) => draftStore.setValue((prev) => ({ ...prev, ...patch })),
    [draftStore],
  );

  const saveSimulation = useCallback(
    (input: CalcInput) => {
      const result = calculateProfit(input, settingsStore.value.lowMarginThreshold);
      const mode = input.calcMode ?? "profit";
      simStore.setValue((prev) => [
        {
          id: uid(),
          storeId: activeStoreId,
          createdAt: new Date().toISOString(),
          input,
          netProfit: result.netProfit,
          netMargin: result.netMargin,
          calculationMode: mode,
          profitType: input.profitType ?? "margin",
          markupPct: input.markupPct ?? 0,
          ...(mode === "price" ? { recommendedPrice: input.price } : {}),
        },
        ...prev,
      ]);
    },
    [simStore, settingsStore.value.lowMarginThreshold, activeStoreId],
  );

  const removeSimulation = useCallback(
    (id: string) => simStore.setValue((prev) => prev.filter((s) => s.id !== id)),
    [simStore],
  );

  const duplicateSimulation = useCallback(
    (id: string) =>
      simStore.setValue((prev) => {
        const found = prev.find((s) => s.id === id);
        if (!found) return prev;
        return [
          { ...found, id: uid(), storeId: activeStoreId, createdAt: new Date().toISOString() },
          ...prev,
        ];
      }),
    [simStore, activeStoreId],
  );

  const saveProduct = useCallback(
    (input: CalcInput) =>
      productStore.setValue((prev) => [
        {
          id: uid(),
          storeId: activeStoreId,
          createdAt: new Date().toISOString(),
          favorite: true,
          input,
        },
        ...prev,
      ]),
    [productStore, activeStoreId],
  );

  const removeProduct = useCallback(
    (id: string) => productStore.setValue((prev) => prev.filter((p) => p.id !== id)),
    [productStore],
  );

  const toggleFavorite = useCallback(
    (id: string) =>
      productStore.setValue((prev) =>
        prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)),
      ),
    [productStore],
  );

  const activeStore = useMemo(
    () => stores.find((s) => s.id === activeStoreId) ?? null,
    [stores, activeStoreId],
  );

  const value = useMemo<VendaCalcContextValue>(
    () => ({
      stores,
      activeStore,
      activeStoreId,
      setActiveStore,
      addStore,
      updateStore,
      duplicateStore,
      deleteStore,
      storeStats,
      settings: settingsStore.value,
      setSettings: settingsStore.setValue,
      draft: draftStore.value,
      setDraft: draftStore.setValue,
      patchDraft,
      simulations: simStore.value,
      saveSimulation,
      removeSimulation,
      duplicateSimulation,
      products: productStore.value,
      saveProduct,
      removeProduct,
      toggleFavorite,
      hydrated: ready && settingsStore.hydrated && draftStore.hydrated,
    }),
    [
      stores,
      activeStore,
      activeStoreId,
      setActiveStore,
      addStore,
      updateStore,
      duplicateStore,
      deleteStore,
      storeStats,
      ready,
      settingsStore.value,
      settingsStore.setValue,
      settingsStore.hydrated,
      draftStore.value,
      draftStore.setValue,
      draftStore.hydrated,
      patchDraft,
      simStore.value,
      saveSimulation,
      removeSimulation,
      duplicateSimulation,
      productStore.value,
      saveProduct,
      removeProduct,
      toggleFavorite,
    ],
  );

  return <VendaCalcContext.Provider value={value}>{children}</VendaCalcContext.Provider>;
}

export function useVendaCalc(): VendaCalcContextValue {
  const ctx = useContext(VendaCalcContext);
  if (!ctx) throw new Error("useVendaCalc precisa estar dentro de <VendaCalcProvider>");
  return ctx;
}
