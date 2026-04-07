/**
 * PCG Fonctions utilitaires
 */

import type { PcgCategory } from './pcg-types';
import { ALL_PCG_CATEGORIES, PCG_MAP } from './pcg-subaccounts';
import { PCG_CLASSES } from './pcg-classes';
import {
  PCG_SUGGESTED_CATEGORIES,
  PCG_SUGGESTED_INCOME_CATEGORIES,
  LEGACY_TO_PCG_MAP,
} from './pcg-suggestions';

/**
 * Obtenir la catégorie PCG à partir d'un code
 */
export function getPcgCategory(code: string): PcgCategory | undefined {
  return PCG_MAP.get(code);
}

/**
 * Obtenir la catégorie parente (classe) d'un code
 */
export function getPcgParentClass(code: string): PcgCategory | undefined {
  const classCode = code.substring(0, 2);
  return PCG_CLASSES.find(c => c.code === classCode);
}

/**
 * Obtenir tous les enfants d'une catégorie
 */
export function getPcgChildren(parentCode: string): PcgCategory[] {
  return ALL_PCG_CATEGORIES.filter(cat => cat.parentCode === parentCode);
}

/**
 * Construire le chemin complet d'une catégorie
 * Ex: "62 > 627 > 6278" pour "Frais bancaires"
 */
export function getPcgPath(code: string): string[] {
  const path: string[] = [];
  let current = getPcgCategory(code);

  while (current) {
    path.unshift(current.code);
    current = current.parentCode
      ? getPcgCategory(current.parentCode)
      : undefined;
  }

  return path;
}

/**
 * Obtenir le libellé complet avec hiérarchie
 * Ex: "Autres services extérieurs > Services bancaires"
 */
export function getPcgFullLabel(code: string): string {
  const path = getPcgPath(code);
  return path.map(c => getPcgCategory(c)?.label ?? c).join(' > ');
}

/**
 * Convertir une ancienne catégorie vers le code PCG
 */
export function migrateLegacyCategory(legacyCategory: string): string {
  return LEGACY_TO_PCG_MAP[legacyCategory] || '658'; // Défaut: Charges diverses
}

/**
 * Grouper des montants par classe PCG (niveau 1)
 * Utile pour les graphiques donut
 */
export function groupByPcgClass(
  items: Array<{ pcgCode: string; amount: number }>
): Array<{ code: string; label: string; total: number }> {
  const grouped = new Map<string, number>();

  for (const item of items) {
    const classCode = item.pcgCode.substring(0, 2);
    const current = grouped.get(classCode) ?? 0;
    grouped.set(classCode, current + Math.abs(item.amount));
  }

  return Array.from(grouped.entries())
    .map(([code, total]) => {
      const category = getPcgCategory(code);
      return {
        code,
        label: category?.label ?? `Classe ${code}`,
        total,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/**
 * Obtenir les catégories suggérées selon le type de transaction
 * - 'debit' (sortie d'argent) → Classe 6 (Charges)
 * - 'credit' (entrée d'argent) → Classe 7 (Produits)
 * - 'all' → Toutes les catégories
 */
export function getPcgCategoriesByType(
  type: 'debit' | 'credit' | 'all'
): PcgCategory[] {
  switch (type) {
    case 'debit':
      return PCG_SUGGESTED_CATEGORIES;
    case 'credit':
      return PCG_SUGGESTED_INCOME_CATEGORIES;
    case 'all':
      return [...PCG_SUGGESTED_CATEGORIES, ...PCG_SUGGESTED_INCOME_CATEGORIES];
  }
}
