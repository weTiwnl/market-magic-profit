import { useCallback, useEffect, useRef, useState } from "react";
import { loadValue, saveValue } from "@/services/storage";

/**
 * localStorage-backed state that is SSR-safe: the first render always uses the
 * fallback, then hydration reads the stored value.
 */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    setValue(loadValue<T>(key, fallback));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    if (firstRun.current) {
      firstRun.current = false;
    }
    saveValue(key, value);
  }, [key, value, hydrated]);

  const reset = useCallback(() => setValue(fallback), [fallback]);

  return { value, setValue, hydrated, reset };
}
