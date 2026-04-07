'use client';

import Image from 'next/image';

import { Store, Check, Loader2, AlertCircle } from 'lucide-react';

import { cn } from '@verone/utils';

import type { LinkMeAffiliate } from '../../../hooks/linkme/use-linkme-affiliates';

interface AffiliateListSectionProps {
  affiliates: LinkMeAffiliate[] | undefined;
  affiliatesLoading: boolean;
  selectedAffiliateId: string;
  onSelect: (id: string) => void;
}

export function AffiliateListSection({
  affiliates,
  affiliatesLoading,
  selectedAffiliateId,
  onSelect,
}: AffiliateListSectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Affilié *
      </label>
      {affiliatesLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          <span className="text-sm text-gray-500">
            Chargement des affiliés...
          </span>
        </div>
      ) : affiliates && affiliates.length > 0 ? (
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {affiliates.map(affiliate => (
            <button
              key={affiliate.id}
              onClick={() => onSelect(affiliate.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                selectedAffiliateId === affiliate.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {affiliate.logo_url ? (
                <Image
                  src={affiliate.logo_url}
                  alt={affiliate.display_name}
                  width={56}
                  height={56}
                  className="w-14 h-14 object-cover rounded-lg"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{affiliate.display_name}</p>
                <p className="text-xs text-gray-500">
                  {affiliate.enseigne_name ??
                    affiliate.organisation_name ??
                    'Affilié LinkMe'}{' '}
                  • {affiliate.selections_count} sélection
                  {affiliate.selections_count > 1 ? 's' : ''}
                </p>
              </div>
              {selectedAffiliateId === affiliate.id && (
                <Check className="h-5 w-5 text-purple-600" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-amber-600 py-2">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          Aucun affilié de ce type disponible
        </p>
      )}
    </div>
  );
}
