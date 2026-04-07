/**
 * PCG Couleurs — Mapping codes PCG vers couleurs Dashboard
 * Cohérence visuelle avec la palette de ExpenseDonutChart
 */

/**
 * Mapping codes PCG vers couleurs du Dashboard (cohérence visuelle)
 * Basé sur la palette CATEGORY_COLORS de ExpenseDonutChart
 */
export const PCG_TO_CATEGORY_COLOR: Record<string, string> = {
  // Classe 60 - Achats
  '60': '#22c55e', // supplies - green
  '601': '#22c55e', // Achats stockés
  '602': '#22c55e', // Achats stockés
  '604': '#22c55e', // Prestations de services
  '606': '#22c55e', // Fournitures non stockées
  '607': '#eab308', // purchase_stock - yellow

  // Classe 61 - Services externes
  '61': '#a855f7', // rent - purple
  '611': '#a855f7', // Sous-traitance
  '612': '#a855f7', // Crédit-bail
  '613': '#a855f7', // Loyers
  '614': '#a855f7', // Charges locatives
  '615': '#14b8a6', // Entretiens - teal
  '616': '#14b8a6', // insurance - teal

  // Classe 62 - Autres services externes
  '62': '#f97316', // professional_services - orange
  '621': '#f97316', // Personnel extérieur
  '622': '#f97316', // Honoraires
  '623': '#ec4899', // marketing - pink
  '624': '#f59e0b', // transport - amber
  '625': '#f59e0b', // Déplacements - amber
  '626': '#10b981', // telecom - emerald
  '627': '#6366f1', // Services bancaires - indigo (bank_fees)
  '628': '#3b82f6', // subscription - blue

  // Classe 63 - Impôts et taxes
  '63': '#8b5cf6', // taxes - violet
  '631': '#8b5cf6',
  '635': '#8b5cf6',

  // Classe 64 - Charges de personnel
  '64': '#ec4899', // pink
  '641': '#ec4899',
  '645': '#ec4899',
  '648': '#ec4899',

  // Classe 65 - Autres charges de gestion
  '65': '#06b6d4', // software/redevances - cyan
  '651': '#06b6d4', // Redevances et licences
  '654': '#64748b',
  '658': '#64748b',

  // Classe 66 - Charges financières
  '66': '#6366f1', // bank_fees - indigo
  '661': '#6366f1',
  '666': '#6366f1',

  // Classe 67 - Charges exceptionnelles
  '67': '#ef4444', // red
  '671': '#ef4444',
  '675': '#ef4444',

  // Classe 68 - Dotations
  '68': '#64748b', // slate
  '681': '#64748b',
  '686': '#64748b',

  // Classe 69 - Impôts sur bénéfices
  '69': '#8b5cf6', // violet
  '695': '#8b5cf6',

  // Classe 70 - Ventes (produits)
  '70': '#10b981', // emerald
  '701': '#10b981',
  '706': '#10b981',
  '707': '#10b981',
  '708': '#10b981',

  // Défaut
  default: '#64748b', // other - slate
};

/**
 * Obtenir la couleur associée à un code PCG
 * Cohérent avec la palette du Dashboard (ExpenseDonutChart)
 */
export function getPcgColor(code: string | null): string {
  if (!code) return PCG_TO_CATEGORY_COLOR['default'];

  // Chercher correspondance exacte
  if (PCG_TO_CATEGORY_COLOR[code]) return PCG_TO_CATEGORY_COLOR[code];

  // Chercher par préfixe (3 chiffres, puis 2 chiffres)
  const prefix3 = code.substring(0, 3);
  if (PCG_TO_CATEGORY_COLOR[prefix3]) return PCG_TO_CATEGORY_COLOR[prefix3];

  const prefix2 = code.substring(0, 2);
  if (PCG_TO_CATEGORY_COLOR[prefix2]) return PCG_TO_CATEGORY_COLOR[prefix2];

  return PCG_TO_CATEGORY_COLOR['default'];
}
