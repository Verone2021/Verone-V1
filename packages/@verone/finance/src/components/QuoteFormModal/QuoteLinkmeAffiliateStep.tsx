'use client';

import { ButtonV2, Input } from '@verone/ui';
import { ArrowLeft, Users, Search, ChevronRight } from 'lucide-react';

interface Affiliate {
  id: string;
  display_name: string;
  type: string;
  selections_count: number;
  enseigne_id?: string | null;
}

interface QuoteLinkmeAffiliateStepProps {
  affiliates: Affiliate[] | undefined;
  affiliateSearch: string;
  onAffiliateSearchChange: (value: string) => void;
  onAffiliateSelect: (affiliateId: string) => void;
  onBack: () => void;
}

export function QuoteLinkmeAffiliateStep({
  affiliates,
  affiliateSearch,
  onAffiliateSearchChange,
  onAffiliateSelect,
  onBack,
}: QuoteLinkmeAffiliateStepProps) {
  return (
    <div className="py-4">
      <div className="mb-4">
        <ButtonV2
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </ButtonV2>
      </div>

      {!affiliates || affiliates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun affilié LinkMe actif</p>
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un affilié..."
              value={affiliateSearch}
              onChange={e => onAffiliateSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
            {affiliates
              .filter(a =>
                a.display_name
                  .toLowerCase()
                  .includes(affiliateSearch.toLowerCase())
              )
              .map(affiliate => (
                <button
                  key={affiliate.id}
                  type="button"
                  onClick={() => onAffiliateSelect(affiliate.id)}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {affiliate.display_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {affiliate.type === 'enseigne'
                        ? 'Enseigne'
                        : 'Org. indépendante'}
                      {affiliate.selections_count > 0 &&
                        ` · ${affiliate.selections_count} sélection(s)`}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500" />
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
