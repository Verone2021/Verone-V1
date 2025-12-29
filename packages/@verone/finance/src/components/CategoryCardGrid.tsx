'use client';

import { cn } from '@verone/ui';

import {
  PCG_SUGGESTED_CATEGORIES,
  PCG_CLASSES,
  PCG_ACCOUNTS,
  type PcgCategory,
} from '../lib/pcg-categories';

// Pour compatibilité arrière, on exporte aussi les anciens types
export type ExpenseCategory = string; // Code PCG (ex: "627")

interface CategoryCardGridProps {
  value: string | null;
  onChange: (categoryCode: string) => void;
  suggestedCategory?: string | null;
  className?: string;
  /** Afficher toutes les catégories groupées par classe (défaut: false = affiche seulement les suggérées) */
  showAll?: boolean;
}

/**
 * Grille de cartes pour sélectionner une catégorie comptable PCG.
 * Affiche les catégories les plus courantes avec leur code et libellé.
 * Conforme au Plan Comptable Général français.
 */
export function CategoryCardGrid({
  value,
  onChange,
  suggestedCategory,
  className,
  showAll = false,
}: CategoryCardGridProps) {
  const categoriesToShow = showAll ? PCG_ACCOUNTS : PCG_SUGGESTED_CATEGORIES;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Suggestion automatique */}
      {suggestedCategory && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm text-blue-700">
          <span>💡</span>
          <span>
            Suggestion :{' '}
            <strong>
              {PCG_SUGGESTED_CATEGORIES.find(c => c.code === suggestedCategory)
                ?.label || suggestedCategory}
            </strong>
          </span>
        </div>
      )}

      {/* Grille des catégories suggérées */}
      {!showAll && (
        <div className="grid grid-cols-3 gap-2">
          {PCG_SUGGESTED_CATEGORIES.map(category => {
            const isSelected = value === category.code;
            const isSuggested = suggestedCategory === category.code;
            const parentClass = PCG_CLASSES.find(
              c => c.code === category.parentCode
            );

            return (
              <button
                key={category.code}
                type="button"
                onClick={() => onChange(category.code)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 transition-all hover:bg-slate-50',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : isSuggested
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-slate-200 bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-400'
                )}
              >
                <span className="text-xl">{parentClass?.icon || '📋'}</span>
                <span
                  className={cn(
                    'text-center text-xs font-medium leading-tight',
                    isSelected ? 'text-blue-700' : 'text-slate-600'
                  )}
                >
                  {category.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {category.code}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Vue complète groupée par classe */}
      {showAll && (
        <div className="space-y-4">
          {PCG_CLASSES.map(pcgClass => {
            const accounts = PCG_ACCOUNTS.filter(
              a => a.parentCode === pcgClass.code
            );
            if (accounts.length === 0) return null;

            return (
              <div key={pcgClass.code} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span>{pcgClass.icon}</span>
                  <span>
                    {pcgClass.code} - {pcgClass.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {accounts.map(account => {
                    const isSelected = value === account.code;
                    return (
                      <button
                        key={account.code}
                        type="button"
                        onClick={() => onChange(account.code)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-all hover:bg-slate-50',
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200'
                        )}
                      >
                        <span className="font-mono text-xs text-slate-400">
                          {account.code}
                        </span>
                        <span className={isSelected ? 'text-blue-700' : ''}>
                          {account.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Mapping mots-clés -> code PCG pour suggestion automatique
const PCG_KEYWORDS: Record<string, string[]> = {
  '627': ['banque', 'commission', 'frais', 'qonto', 'stripe', 'paypal'],
  '651': [
    'abonnement',
    'saas',
    'vercel',
    'aws',
    'notion',
    'slack',
    'zoom',
    'heroku',
  ],
  '606': ['fourniture', 'bureau', 'papeterie', 'amazon'],
  '624': [
    'transport',
    'livraison',
    'chronopost',
    'ups',
    'dhl',
    'fedex',
    'colissimo',
  ],
  '623': [
    'marketing',
    'publicité',
    'pub',
    'facebook',
    'google ads',
    'meta',
    'linkedin',
  ],
  '635': ['taxe', 'impôt', 'urssaf', 'cfe', 'tva', 'cotisation'],
  '616': ['assurance', 'axa', 'allianz', 'maif', 'maaf'],
  '622': ['conseil', 'avocat', 'comptable', 'expert', 'notaire', 'huissier'],
  '626': [
    'mobile',
    'free',
    'orange',
    'sfr',
    'bouygues',
    'ovh',
    'internet',
    'téléphone',
  ],
  '613': ['loyer', 'location', 'bail', 'immobilier'],
  '607': ['achat', 'marchandise', 'stock', 'fournisseur'],
  '625': [
    'restaurant',
    'repas',
    'hôtel',
    'train',
    'avion',
    'péage',
    'carburant',
    'uber',
  ],
};

/**
 * Suggère un code PCG basé sur le libellé de la transaction
 */
export function suggestCategory(label: string): string | null {
  const normalizedLabel = label.toLowerCase().trim();

  for (const [pcgCode, keywords] of Object.entries(PCG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedLabel.includes(keyword.toLowerCase())) {
        return pcgCode;
      }
    }
  }

  return null;
}
