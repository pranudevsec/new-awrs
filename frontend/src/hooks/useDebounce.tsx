import { useRef, useEffect, useCallback } from "react";

export function useDebounce(callback: (...args: any[]) => void, delay: number) {
  const timer = useRef<any>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return debouncedCallback;
}
