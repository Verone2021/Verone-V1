'use client';

import { cn } from '@verone/ui';

import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '../hooks/use-expenses';

interface CategoryCardGridProps {
  value: ExpenseCategory | null;
  onChange: (category: ExpenseCategory) => void;
  suggestedCategory?: ExpenseCategory | null;
  className?: string;
}

/**
 * Grille de cartes cliquables pour sélectionner une catégorie de dépense.
 * Affiche les catégories avec leur emoji et label.
 */
export function CategoryCardGrid({
  value,
  onChange,
  suggestedCategory,
  className,
}: CategoryCardGridProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {suggestedCategory && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm text-blue-700">
          <span>💡</span>
          <span>
            Suggestion :{' '}
            <strong>
              {EXPENSE_CATEGORIES.find(c => c.id === suggestedCategory)?.emoji}{' '}
              {EXPENSE_CATEGORIES.find(c => c.id === suggestedCategory)?.label}
            </strong>
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {EXPENSE_CATEGORIES.map(category => {
          const isSelected = value === category.id;
          const isSuggested = suggestedCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
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
              <span className="text-2xl">{category.emoji}</span>
              <span
                className={cn(
                  'text-center text-xs font-medium leading-tight',
                  isSelected ? 'text-blue-700' : 'text-slate-600'
                )}
              >
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Type helpers pour la suggestion automatique de catégorie
const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  bank_fees: ['banque', 'commission', 'frais', 'qonto', 'stripe'],
  subscription: ['abonnement', 'mensuel', 'annuel'],
  supplies: ['fourniture', 'bureau', 'papeterie'],
  transport: ['transport', 'livraison', 'chronopost', 'ups', 'dhl', 'fedex'],
  marketing: [
    'marketing',
    'publicité',
    'pub',
    'facebook',
    'google ads',
    'meta',
  ],
  taxes: ['taxe', 'impôt', 'urssaf', 'cfe', 'tva'],
  insurance: ['assurance', 'axa', 'allianz', 'maif'],
  professional_services: ['conseil', 'avocat', 'comptable', 'expert'],
  software: ['logiciel', 'saas', 'vercel', 'aws', 'notion', 'slack', 'zoom'],
  telecom: ['mobile', 'free', 'orange', 'sfr', 'bouygues', 'ovh', 'internet'],
  rent: ['loyer', 'location', 'bail'],
  purchase_stock: ['achat', 'marchandise', 'stock', 'fournisseur'],
  other: [],
};

/**
 * Suggère une catégorie basée sur le libellé de la transaction
 */
export function suggestCategory(label: string): ExpenseCategory | null {
  const normalizedLabel = label.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedLabel.includes(keyword.toLowerCase())) {
        return category as ExpenseCategory;
      }
    }
  }

  return null;
}
