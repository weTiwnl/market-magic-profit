import { useCallback, useEffect, useRef, useState } from "react";
import { loadValue, saveValue } from "@/services/storage";

/**
 * localStorage-backed state that is SSR-safe: the first render always uses the
 * fallback, then hydration reads the stored value.
 *
 * `enabled: false` suspends all reads/writes — used while the active store is
 * still unknown, so we never persist under a placeholder key.
 */
export function usePersistentState<T>(key: string, fallback: T, enabled = true) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!enabled) {
      setHydrated(false);
      return;
    }
    setValue(loadValue<T>(key, fallback));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  useEffect(() => {
    if (!hydrated || !enabled) return;
    if (firstRun.current) {
      firstRun.current = false;
    }
    saveValue(key, value);
  }, [key, value, hydrated, enabled]);

  const reset = useCallback(() => setValue(fallback), [fallback]);

  return { value, setValue, hydrated, reset };
}
