/**
 * Hook: useToggle
 * Toggle boolean state avec setters sémantiques
 * Compatible shadcn/ui patterns
 */

import { useState, useCallback } from 'react';

/**
 * Hook pour toggle un état boolean
 * @param initialValue - Valeur initiale (défaut: false)
 * @returns [value, toggle, setValue] - État, fonction toggle, et setter
 *
 * @example
 * const [isOpen, toggleOpen, setOpen] = useToggle(false)
 *
 * <button onClick={toggleOpen}>Toggle</button>
 * <button onClick={() => setOpen(true)}>Open</button>
 * <button onClick={() => setOpen(false)}>Close</button>
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return [value, toggle, setValue];
}
