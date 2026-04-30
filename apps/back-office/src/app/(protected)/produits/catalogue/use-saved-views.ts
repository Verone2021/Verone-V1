'use client';

import { useMemo } from 'react';

import type { Filters } from './types';

/**
 * Vues sauvegardées catalogue — BO-CATALOG-VIEWS-001 phase 1.
 *
 * 5 vues système prédéfinies. Chaque vue retourne un set de filtres + un
 * onglet cible. Cliquer sur une vue applique les filtres immédiatement.
 *
 * Phase 2 (PR future) : ajout de vues personnalisées localStorage.
 * Phase 3 (PR future) : vues partagées en équipe via une table DB
 *   `catalogue_saved_views`.
 */
export interface SavedView {
  id: string;
  label: string;
  description: string;
  emoji: string;
  /** Onglet cible (active / incomplete / archived) */
  tab: 'active' | 'incomplete' | 'archived';
  /** Filtres pré-appliqués */
  filters: Partial<Filters>;
  /** Indique si c'est une vue système (non supprimable) */
  system: true;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  families: [],
  categories: [],
  subcategories: [],
  suppliers: [],
  statuses: [],
  missingFields: [],
  stockLevels: [],
  conditions: [],
  completionLevels: [],
};

const SYSTEM_VIEWS: SavedView[] = [
  {
    id: 'sys-to-publish',
    label: 'À publier en ligne',
    description: 'Produits actifs non encore publiés sur le site',
    emoji: '🌐',
    tab: 'active',
    filters: {
      ...EMPTY_FILTERS,
      statuses: ['active'],
      completionLevels: ['high'],
    },
    system: true,
  },
  {
    id: 'sys-no-weight',
    label: 'Sans poids',
    description: 'Bloque le calcul transport Packlink',
    emoji: '⚖️',
    tab: 'incomplete',
    filters: {
      ...EMPTY_FILTERS,
      missingFields: ['weight'],
    },
    system: true,
  },
  {
    id: 'sys-no-photo',
    label: 'Sans photo',
    description: 'Photos manquantes — impossible à exposer site',
    emoji: '📷',
    tab: 'incomplete',
    filters: {
      ...EMPTY_FILTERS,
      missingFields: ['photo'],
    },
    system: true,
  },
  {
    id: 'sys-low-margin',
    label: 'Marge faible',
    description: 'Produits actifs avec une marge < 50%',
    emoji: '📉',
    tab: 'active',
    filters: {
      ...EMPTY_FILTERS,
      statuses: ['active'],
      completionLevels: ['low', 'medium'],
    },
    system: true,
  },
  {
    id: 'sys-out-of-stock',
    label: 'Stock épuisé',
    description: 'Produits actifs sans stock réel',
    emoji: '🚨',
    tab: 'active',
    filters: {
      ...EMPTY_FILTERS,
      statuses: ['active'],
      stockLevels: ['out_of_stock'],
    },
    system: true,
  },
];

export function useSavedViews(): SavedView[] {
  // Phase 1 : juste les vues système.
  // Phase 2 : merge avec localStorage `verone:catalogue-saved-views`
  return useMemo(() => SYSTEM_VIEWS, []);
}

/**
 * Construit un objet Filters complet à partir d'une SavedView.
 * Garantit que tous les champs Filters sont définis (l'UI nécessite des
 * tableaux non-undefined).
 */
export function viewToFilters(view: SavedView): Filters {
  return {
    ...EMPTY_FILTERS,
    ...view.filters,
  };
}
