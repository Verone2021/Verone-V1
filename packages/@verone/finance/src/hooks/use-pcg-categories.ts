/**
 * Hook pour la gestion des catégories PCG (Plan Comptable Général)
 *
 * Récupère les catégories comptables depuis la table pcg_categories
 * Structure hiérarchique: Classe (niveau 1) → Compte (niveau 2) → Sous-compte (niveau 3)
 *
 * Conforme au PCG 2025 français officiel (sources ANC, Indy, Pennylane)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// Types pour les catégories PCG
export interface PcgCategory {
  id: string;
  code: string;
  label: string;
  parent_code: string | null;
  level: 1 | 2 | 3;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

export interface PcgCategoryTree extends PcgCategory {
  full_path: string;
  parent_label: string;
}

export interface UsePcgCategoriesReturn {
  /** Toutes les catégories */
  categories: PcgCategory[];
  /** Catégories de niveau 1 (classes: 60, 61, 62...) */
  classes: PcgCategory[];
  /** Est en cours de chargement */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Récupérer les comptes (niveau 2) d'une classe */
  getAccounts: (classCode: string) => PcgCategory[];
  /** Récupérer les sous-comptes (niveau 3) d'un compte */
  getSubaccounts: (accountCode: string) => PcgCategory[];
  /** Récupérer une catégorie par son code */
  getCategory: (code: string) => PcgCategory | undefined;
  /** Récupérer le chemin complet (ex: "Autres services ext. > Services bancaires > Frais bancaires") */
  getFullPath: (code: string) => string;
  /** Rechercher des catégories par texte */
  search: (query: string) => PcgCategory[];
  /** Recharger les données */
  refetch: () => Promise<void>;
}

export function usePcgCategories(): UsePcgCategoriesReturn {
  const [categories, setCategories] = useState<PcgCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Table pcg_categories n'est pas dans les types Supabase générés
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = (await (supabase as any)
        .from('pcg_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })) as {
        data: PcgCategory[] | null;
        error: { message: string } | null;
      };

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setCategories(data || []);
    } catch (err) {
      console.error('[usePcgCategories] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Classes (niveau 1)
  const classes = categories.filter(c => c.level === 1);

  // Récupérer les comptes d'une classe
  const getAccounts = useCallback(
    (classCode: string): PcgCategory[] => {
      return categories.filter(
        c => c.level === 2 && c.parent_code === classCode
      );
    },
    [categories]
  );

  // Récupérer les sous-comptes d'un compte
  const getSubaccounts = useCallback(
    (accountCode: string): PcgCategory[] => {
      return categories.filter(
        c => c.level === 3 && c.parent_code === accountCode
      );
    },
    [categories]
  );

  // Récupérer une catégorie par code
  const getCategory = useCallback(
    (code: string): PcgCategory | undefined => {
      return categories.find(c => c.code === code);
    },
    [categories]
  );

  // Construire le chemin complet
  const getFullPath = useCallback(
    (code: string): string => {
      const category = getCategory(code);
      if (!category) return '';

      const parts: string[] = [];

      if (category.level === 3 && category.parent_code) {
        const account = getCategory(category.parent_code);
        if (account?.parent_code) {
          const classItem = getCategory(account.parent_code);
          if (classItem) parts.push(classItem.label);
        }
        if (account) parts.push(account.label);
      } else if (category.level === 2 && category.parent_code) {
        const classItem = getCategory(category.parent_code);
        if (classItem) parts.push(classItem.label);
      }

      parts.push(category.label);
      return parts.join(' > ');
    },
    [getCategory]
  );

  // Recherche dans les catégories
  const search = useCallback(
    (query: string): PcgCategory[] => {
      if (!query || query.length < 2) return [];

      const q = query.toLowerCase();
      return categories
        .filter(
          c =>
            c.code.includes(q) ||
            c.label.toLowerCase().includes(q) ||
            (c.description && c.description.toLowerCase().includes(q))
        )
        .slice(0, 15);
    },
    [categories]
  );

  return {
    categories,
    classes,
    isLoading,
    error,
    getAccounts,
    getSubaccounts,
    getCategory,
    getFullPath,
    search,
    refetch: fetchCategories,
  };
}
