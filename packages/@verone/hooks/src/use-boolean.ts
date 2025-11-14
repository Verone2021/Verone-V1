/**
 * Hook: useBoolean
 * Gérer state boolean avec setters sémantiques
 * Compatible shadcn/ui patterns
 */

import { useState, useCallback } from 'react';

interface UseBooleanReturn {
  value: boolean;
  setValue: (value: boolean) => void;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
}

/**
 * Hook pour gérer un état boolean avec méthodes sémantiques
 * @param initialValue - Valeur initiale (défaut: false)
 * @returns Object avec value et setters sémantiques
 *
 * @example
 * const modal = useBoolean(false)
 *
 * <button onClick={modal.setTrue}>Open Modal</button>
 * <button onClick={modal.setFalse}>Close Modal</button>
 * <button onClick={modal.toggle}>Toggle Modal</button>
 * {modal.value && <Modal />}
 */
export function useBoolean(initialValue: boolean = false): UseBooleanReturn {
  const [value, setValue] = useState<boolean>(initialValue);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return {
    value,
    setValue,
    setTrue,
    setFalse,
    toggle,
  };
}
