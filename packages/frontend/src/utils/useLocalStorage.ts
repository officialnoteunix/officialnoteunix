import { useState, useCallback, useEffect } from 'react';

function readValue<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(() => readValue(key) ?? defaultValue);

  useEffect(() => {
    const onChange = (e: StorageEvent | CustomEvent) => {
      const k = e instanceof StorageEvent ? e.key : (e as CustomEvent).detail?.key;
      if (k === key) {
        setValue(readValue(key) ?? defaultValue);
      }
    };
    window.addEventListener('storage', onChange);
    window.addEventListener('local-storage', onChange as EventListener);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('local-storage', onChange as EventListener);
    };
  }, [key, defaultValue]);

  const set = useCallback((val: T) => {
    setValue(val);
    try {
      const next = JSON.stringify(val);
      localStorage.setItem(key, next);
      window.dispatchEvent(new CustomEvent('local-storage', { detail: { key } }));
    } catch {}
  }, [key]);

  return [value, set];
}

export function useLocalStorageNum(key: string, defaultValue = 0): [number, (val: number) => void] {
  const [value, setValue] = useLocalStorage<number>(key, defaultValue);
  return [value, setValue];
}

export default useLocalStorage;
