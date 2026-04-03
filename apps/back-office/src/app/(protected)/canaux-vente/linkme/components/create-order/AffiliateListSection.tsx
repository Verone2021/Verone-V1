'use client';

import Image from 'next/image';
import { cn } from '@verone/utils';
import { Store, Check, AlertCircle, Loader2 } from 'lucide-react';

interface Affiliate {
  id: string;
  display_name: string;
  logo_url: string | null;
  enseigne_name: string | null;
  organisation_name: string | null;
  selections_count: number;
}

interface AffiliateListSectionProps {
  affiliates: Affiliate[] | undefined;
  isLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AffiliateListSection({
  affiliates,
  isLoading,
  selectedId,
  onSelect,
}: AffiliateListSectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Affilié *
      </label>
      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          <span className="text-sm text-gray-500">
            Chargement des affiliés...
          </span>
        </div>
      ) : affiliates && affiliates.length > 0 ? (
        <div className="grid gap-2 max-h-40 overflow-y-auto">
          {affiliates.map(affiliate => (
            <button
              key={affiliate.id}
              onClick={() => onSelect(affiliate.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                selectedId === affiliate.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {affiliate.logo_url ? (
                <Image
                  src={affiliate.logo_url}
                  alt={affiliate.display_name}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
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
              {selectedId === affiliate.id && (
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
