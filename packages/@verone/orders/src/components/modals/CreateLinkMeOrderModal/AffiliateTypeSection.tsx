'use client';

import { Store, Building2, Check } from 'lucide-react';

import { cn } from '@verone/utils';

import type { AffiliateType } from '../../../hooks/linkme/use-linkme-affiliates';

interface AffiliateTypeSectionProps {
  affiliateType: AffiliateType | null;
  onSelect: (type: AffiliateType) => void;
}

export function AffiliateTypeSection({
  affiliateType,
  onSelect,
}: AffiliateTypeSectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Type d&apos;affilié *
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSelect('enseigne')}
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
            affiliateType === 'enseigne'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <Store
            className={cn(
              'h-5 w-5',
              affiliateType === 'enseigne' ? 'text-purple-600' : 'text-gray-400'
            )}
          />
          <div>
            <p
              className={cn(
                'font-medium',
                affiliateType === 'enseigne'
                  ? 'text-purple-700'
                  : 'text-gray-700'
              )}
            >
              Enseigne
            </p>
            <p className="text-xs text-gray-500">Chaîne de magasins affiliée</p>
          </div>
          {affiliateType === 'enseigne' && (
            <Check className="h-5 w-5 text-purple-600 ml-auto" />
          )}
        </button>

        <button
          onClick={() => onSelect('org_independante')}
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
            affiliateType === 'org_independante'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <Building2
            className={cn(
              'h-5 w-5',
              affiliateType === 'org_independante'
                ? 'text-purple-600'
                : 'text-gray-400'
            )}
          />
          <div>
            <p
              className={cn(
                'font-medium',
                affiliateType === 'org_independante'
                  ? 'text-purple-700'
                  : 'text-gray-700'
              )}
            >
              Organisation indépendante
            </p>
            <p className="text-xs text-gray-500">
              Entreprise affiliée autonome
            </p>
          </div>
          {affiliateType === 'org_independante' && (
            <Check className="h-5 w-5 text-purple-600 ml-auto" />
          )}
        </button>
      </div>
    </div>
  );
}
