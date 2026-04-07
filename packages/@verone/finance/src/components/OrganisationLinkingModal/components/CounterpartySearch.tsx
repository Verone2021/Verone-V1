'use client';

import { cn } from '@verone/ui';
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';
import { Building2, Check, Loader2, Plus, Search, User, X } from 'lucide-react';

import type { CounterpartyType, ISelectedCounterparty } from '../types';

interface ICounterpartyTypeInfo {
  label: string;
}

function getTypeInfo(type: CounterpartyType): ICounterpartyTypeInfo {
  switch (type) {
    case 'individual':
      return { label: 'Client particulier' };
    case 'customer_pro':
      return { label: 'Client professionnel' };
    case 'supplier':
      return { label: 'Fournisseur' };
    case 'partner':
      return { label: 'Prestataire' };
  }
}

interface ICounterpartySearchProps {
  counterpartyType: CounterpartyType;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchResults: ISelectedCounterparty[];
  isLoading: boolean;
  isCreatingNew: boolean;
  newName: string;
  onNewNameChange: (n: string) => void;
  newEmail: string;
  onNewEmailChange: (e: string) => void;
  selectedCounterparty: ISelectedCounterparty | null;
  onSelectCounterparty: (c: ISelectedCounterparty) => void;
  onClearCounterparty: () => void;
  onStartCreating: (name: string) => void;
}

export function CounterpartySearch({
  counterpartyType,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isLoading,
  isCreatingNew,
  newName,
  onNewNameChange,
  newEmail,
  onNewEmailChange,
  selectedCounterparty,
  onSelectCounterparty,
  onClearCounterparty,
  onStartCreating,
}: ICounterpartySearchProps): React.JSX.Element {
  const searchLabel =
    counterpartyType === 'individual'
      ? 'Client particulier'
      : counterpartyType === 'customer_pro'
        ? 'Organisation cliente'
        : 'Organisation';

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-base font-semibold">
        <Search size={16} className="text-slate-400" />
        {searchLabel}
      </Label>

      {selectedCounterparty && (
        <div className="flex items-center justify-between rounded-xl border-2 border-blue-500 bg-blue-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
              {selectedCounterparty.isOrganisation ? (
                <Building2 size={20} />
              ) : (
                <User size={20} />
              )}
            </div>
            <div>
              <div className="font-medium text-slate-900">
                {selectedCounterparty.name}
              </div>
              <div className="text-xs text-slate-500">
                {getTypeInfo(selectedCounterparty.type).label}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearCounterparty}
            className="rounded-full p-1 hover:bg-blue-100"
          >
            <X size={16} className="text-blue-600" />
          </button>
        </div>
      )}

      {!selectedCounterparty && (
        <>
          <div className="relative">
            <Input
              placeholder={
                counterpartyType === 'individual'
                  ? 'Rechercher un client particulier...'
                  : 'Rechercher une organisation...'
              }
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              className="h-11 pl-4 pr-10"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {searchResults.map(result => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => {
                    onSelectCounterparty(result);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50"
                >
                  {result.isOrganisation ? (
                    <Building2 size={16} className="text-slate-400" />
                  ) : (
                    <User size={16} className="text-slate-400" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{result.name}</div>
                    <div className="text-xs text-slate-500">
                      {getTypeInfo(result.type).label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading &&
            searchQuery.length > 0 &&
            searchResults.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-4 text-center">
                  <p className="text-sm text-slate-500">
                    Aucun résultat trouvé
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onStartCreating(searchQuery)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                    isCreatingNew
                      ? 'border-green-500 bg-green-50'
                      : 'border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      isCreatingNew
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <Plus size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      Créer &quot;{searchQuery}&quot;
                    </div>
                    <div className="text-xs text-slate-500">
                      {counterpartyType === 'individual'
                        ? 'Nouveau client particulier'
                        : 'Nouvelle organisation'}
                    </div>
                  </div>
                  {isCreatingNew && (
                    <Check size={16} className="text-green-600" />
                  )}
                </button>
              </div>
            )}

          {isCreatingNew && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Input
                value={newName}
                onChange={e => onNewNameChange(e.target.value)}
                placeholder={
                  counterpartyType === 'individual'
                    ? 'Prénom Nom'
                    : "Nom de l'organisation"
                }
                className="h-11"
                autoFocus
              />
              {counterpartyType === 'individual' && (
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => onNewEmailChange(e.target.value)}
                  placeholder="Email (obligatoire)"
                  className="h-11"
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
