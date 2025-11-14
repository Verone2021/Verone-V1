/**
 * Hook: useCounter
 * Compteur avec increment/decrement/reset
 * Compatible shadcn/ui patterns
 */

import { useState, useCallback } from 'react';

interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (value: number) => void;
}

/**
 * Hook pour gérer un compteur
 * @param initialValue - Valeur initiale (défaut: 0)
 * @param min - Valeur minimum (optionnel)
 * @param max - Valeur maximum (optionnel)
 * @returns Object avec count et méthodes
 *
 * @example
 * const counter = useCounter(0, 0, 10)
 *
 * <button onClick={counter.decrement}>-</button>
 * <span>{counter.count}</span>
 * <button onClick={counter.increment}>+</button>
 * <button onClick={counter.reset}>Reset</button>
 */
export function useCounter(
  initialValue: number = 0,
  min?: number,
  max?: number
): UseCounterReturn {
  const [count, setCount] = useState<number>(initialValue);

  const increment = useCallback(() => {
    setCount(prev => {
      const next = prev + 1;
      if (max !== undefined && next > max) return prev;
      return next;
    });
  }, [max]);

  const decrement = useCallback(() => {
    setCount(prev => {
      const next = prev - 1;
      if (min !== undefined && next < min) return prev;
      return next;
    });
  }, [min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const setValue = useCallback(
    (value: number) => {
      setCount(prev => {
        if (min !== undefined && value < min) return prev;
        if (max !== undefined && value > max) return prev;
        return value;
      });
    },
    [min, max]
  );

  return {
    count,
    increment,
    decrement,
    reset,
    setCount: setValue,
  };
}
