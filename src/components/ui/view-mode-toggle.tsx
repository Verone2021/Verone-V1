'use client';

import React from 'react';

import { Grid, List } from 'lucide-react';

import { cn } from '@verone/utils';

/**
 * Mode d'affichage (grille ou liste)
 */
export type ViewMode = 'grid' | 'list';

/**
 * Variante visuelle du toggle
 */
export type ViewModeVariant = 'outline' | 'pills' | 'segmented';

/**
 * Props pour ViewModeToggle
 */
export interface ViewModeToggleProps {
  /** Mode actif */
  value: ViewMode;
  /** Callback changement mode */
  onChange: (value: ViewMode) => void;
  /** Variante visuelle */
  variant?: ViewModeVariant;
  /** Classe CSS additionnelle */
  className?: string;
}

/**
 * ViewModeToggle - Button Group élégant pour toggle Grid/List
 *
 * 3 Variantes :
 * 1. **outline** : Bordures noires, style Vérone classique (défaut)
 * 2. **pills** : Arrondis complets, moderne
 * 3. **segmented** : Style iOS, seamless
 *
 * Design :
 * - Grid icon : lucide-react Grid
 * - List icon : lucide-react List
 * - Active state : bg-black text-white (outline) ou bg-primary (autres)
 * - Transition : 200ms smooth
 *
 * Remplace le toggle basique dans catalogue page
 *
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useState<ViewMode>('grid')
 *
 * <ViewModeToggle
 *   value={viewMode}
 *   onChange={setViewMode}
 *   variant="outline"
 * />
 * ```
 *
 * @see /src/lib/theme-v2.ts pour Design System V2
 */
export function ViewModeToggle({
  value,
  onChange,
  variant = 'outline',
  className,
}: ViewModeToggleProps) {
  // Classes base communes
  const baseButtonClasses = cn(
    'inline-flex items-center justify-center',
    'px-3 py-2',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'cursor-pointer'
  );

  // Classes selon variante
  const variantClasses = {
    outline: {
      container: 'flex border border-black',
      button: (isActive: boolean) =>
        cn(
          baseButtonClasses,
          'border-0 rounded-none',
          isActive
            ? 'bg-black text-white'
            : 'bg-white text-black hover:bg-neutral-100'
        ),
      separator: 'border-l border-black',
    },
    pills: {
      container: 'inline-flex gap-1 p-1 bg-neutral-100 rounded-full',
      button: (isActive: boolean) =>
        cn(
          baseButtonClasses,
          'rounded-full',
          isActive
            ? 'bg-black text-white shadow-sm'
            : 'bg-transparent text-black hover:bg-neutral-200'
        ),
      separator: null,
    },
    segmented: {
      container: 'inline-flex bg-neutral-100 rounded-lg p-0.5',
      button: (isActive: boolean) =>
        cn(
          baseButtonClasses,
          'rounded-md',
          isActive
            ? 'bg-white text-black shadow-sm'
            : 'bg-transparent text-neutral-600 hover:text-black'
        ),
      separator: null,
    },
  };

  const styles = variantClasses[variant];

  return (
    <div
      className={cn(styles.container, className)}
      role="group"
      aria-label="Mode d'affichage"
    >
      {/* Bouton Grid */}
      <button
        onClick={() => onChange('grid')}
        className={styles.button(value === 'grid')}
        aria-pressed={value === 'grid'}
        aria-label="Affichage en grille"
        type="button"
      >
        <Grid className="h-4 w-4" />
      </button>

      {/* Séparateur (outline seulement) */}
      {styles.separator && variant === 'outline' && (
        <div className={styles.separator} aria-hidden="true" />
      )}

      {/* Bouton List */}
      <button
        onClick={() => onChange('list')}
        className={styles.button(value === 'list')}
        aria-pressed={value === 'list'}
        aria-label="Affichage en liste"
        type="button"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Export default pour compatibilité
 */
export default ViewModeToggle;
