'use client';

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Briefcase, CheckCircle, Search, Store } from 'lucide-react';

import type { Enseigne, Organisation } from './types';

interface EntityPickerProps {
  entityType: 'organisation' | 'enseigne';
  entitySearch: string;
  onEntitySearchChange: (value: string) => void;
  filteredEntities: (Organisation | Enseigne)[];
  selectedEntityId: string;
  onEntitySelect: (entityId: string) => void;
  availableOrganisationsCount: number;
  availableEnseignesCount: number;
}

export function EntityPicker({
  entityType,
  entitySearch,
  onEntitySearchChange,
  filteredEntities,
  selectedEntityId,
  onEntitySelect,
  availableOrganisationsCount,
  availableEnseignesCount,
}: EntityPickerProps) {
  return (
    <div className="grid gap-2">
      <Label>
        {entityType === 'organisation' ? 'Organisation' : 'Enseigne'} *
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Rechercher une ${entityType}...`}
          value={entitySearch}
          onChange={e => onEntitySearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="max-h-48 overflow-y-auto border rounded-md">
        {filteredEntities.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {entitySearch
              ? 'Aucun résultat'
              : entityType === 'organisation'
                ? `${availableOrganisationsCount} organisation(s) disponible(s)`
                : `${availableEnseignesCount} enseigne(s) disponible(s)`}
          </div>
        ) : (
          <div className="divide-y">
            {filteredEntities.slice(0, 10).map(entity => {
              const isOrg = entityType === 'organisation';
              const name = isOrg
                ? ((entity as Organisation).trade_name ??
                  (entity as Organisation).legal_name)
                : (entity as Enseigne).name;
              const isSelected = selectedEntityId === entity.id;

              return (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => onEntitySelect(entity.id)}
                  className={`w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${isOrg ? 'bg-blue-100' : 'bg-purple-100'}`}
                  >
                    {isOrg ? (
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Store className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{name}</p>
                    {isOrg && (entity as Organisation).trade_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {(entity as Organisation).legal_name}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
