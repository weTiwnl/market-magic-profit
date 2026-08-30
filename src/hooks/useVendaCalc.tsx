import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { AppSettings, CalcInput, SavedProduct, SavedSimulation } from "@/types";
import { DEFAULT_SETTINGS, createEmptyInput } from "@/calculators/defaults";
import { calculateProfit } from "@/calculators/profit";
import { STORAGE_KEYS } from "@/services/storage";
import { uid } from "@/utils/format";
import { usePersistentState } from "./usePersistentState";

interface VendaCalcContextValue {
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
  const settingsStore = usePersistentState<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const draftStore = usePersistentState<CalcInput>(STORAGE_KEYS.draft, createEmptyInput());
  const simStore = usePersistentState<SavedSimulation[]>(STORAGE_KEYS.simulations, []);
  const productStore = usePersistentState<SavedProduct[]>(STORAGE_KEYS.products, []);

  const patchDraft = useCallback(
    (patch: Partial<CalcInput>) => draftStore.setValue((prev) => ({ ...prev, ...patch })),
    [draftStore],
  );

  const saveSimulation = useCallback(
    (input: CalcInput) => {
      const result = calculateProfit(input, settingsStore.value.lowMarginThreshold);
      simStore.setValue((prev) => [
        {
          id: uid(),
          createdAt: new Date().toISOString(),
          input,
          netProfit: result.netProfit,
          netMargin: result.netMargin,
        },
        ...prev,
      ]);
    },
    [simStore, settingsStore.value.lowMarginThreshold],
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
        return [{ ...found, id: uid(), createdAt: new Date().toISOString() }, ...prev];
      }),
    [simStore],
  );

  const saveProduct = useCallback(
    (input: CalcInput) =>
      productStore.setValue((prev) => [
        { id: uid(), createdAt: new Date().toISOString(), favorite: true, input },
        ...prev,
      ]),
    [productStore],
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

  const value = useMemo<VendaCalcContextValue>(
    () => ({
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
      hydrated: settingsStore.hydrated && draftStore.hydrated,
    }),
    [
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
