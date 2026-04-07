'use client';

import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import { Input } from '@verone/ui/components/ui/input';
import { Building2, Loader2, Search, X } from 'lucide-react';

import type { FoundOrganisation } from './types';

interface OrgSearchSectionProps {
  selectedOrg: { id: string; name: string; isServiceProvider?: boolean } | null;
  showOrgSearch: boolean;
  orgSearchQuery: string;
  orgSearchResults: FoundOrganisation[];
  isSearchingOrg: boolean;
  onOrgSearchQueryChange: (value: string) => void;
  onSelectOrg: (org: {
    id: string;
    name: string;
    isServiceProvider?: boolean;
  }) => void;
  onClearOrg: () => void;
  onShowOrgSearch: (show: boolean) => void;
}

export function OrgSearchSection({
  selectedOrg,
  showOrgSearch,
  orgSearchQuery,
  orgSearchResults,
  isSearchingOrg,
  onOrgSearchQueryChange,
  onSelectOrg,
  onClearOrg,
  onShowOrgSearch,
}: OrgSearchSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-slate-500" />
        Organisation liée
        <span className="text-xs font-normal text-slate-400">(optionnel)</span>
      </h3>

      {selectedOrg && !showOrgSearch ? (
        <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-slate-900">
              {selectedOrg.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShowOrgSearch(true)}
              className="text-slate-500"
            >
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearOrg}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : !selectedOrg && !showOrgSearch ? (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-slate-200 p-3">
          <p className="text-sm text-slate-500 text-center">
            Aucune organisation liée
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShowOrgSearch(true)}
            className="mx-auto"
          >
            <Building2 className="h-4 w-4 mr-1" />
            Ajouter une organisation
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher une organisation..."
              value={orgSearchQuery}
              onChange={e => onOrgSearchQueryChange(e.target.value)}
              className="pl-10"
            />
            {isSearchingOrg && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>

          {orgSearchResults.length > 0 && (
            <div className="space-y-1 max-h-[150px] overflow-y-auto border rounded-lg p-1">
              {orgSearchResults.map(org => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => {
                    onSelectOrg({
                      id: org.id,
                      name: org.legal_name,
                      isServiceProvider: org.is_service_provider,
                    });
                  }}
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-slate-100"
                >
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm truncate">{org.legal_name}</span>
                  {org.is_service_provider && (
                    <Badge variant="outline" className="text-xs">
                      Prestataire
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onShowOrgSearch(false);
              onOrgSearchQueryChange('');
            }}
            className="text-slate-500"
          >
            <X className="h-4 w-4 mr-1" />
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}
