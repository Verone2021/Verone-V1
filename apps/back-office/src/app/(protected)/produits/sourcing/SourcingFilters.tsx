'use client';

import { useMemo } from 'react';

import { useOrganisations } from '@verone/organisations';
import { SOURCING_STAGES, SOURCING_STAGE_LABELS } from '@verone/products/utils';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Search, X } from 'lucide-react';

interface SourcingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sourcingTypeFilter: string;
  onSourcingTypeChange: (value: string) => void;
  supplierFilter: string | null;
  onSupplierChange: (id: string | null) => void;
  /** Étape : proposée seulement dans « En cours » */
  showStageFilter: boolean;
  stageFilter: string;
  onStageChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
}

interface SupplierOption {
  id: string;
  name: string;
}

const TRIGGER = 'h-11 w-full text-sm sm:w-[150px] md:h-8 md:text-xs';

export function SourcingFilters({
  searchTerm,
  onSearchChange,
  sourcingTypeFilter,
  onSourcingTypeChange,
  supplierFilter,
  onSupplierChange,
  showStageFilter,
  stageFilter,
  onStageChange,
  priorityFilter,
  onPriorityChange,
}: SourcingFiltersProps) {
  // BO-SOURCING-001 : utilise le hook centralisé `useOrganisations` au lieu
  // de dupliquer le fetch fournisseurs.
  const { organisations: suppliersData } = useOrganisations({
    type: 'supplier',
    is_active: true,
  });

  const suppliers = useMemo<SupplierOption[]>(
    () =>
      suppliersData.map(o => ({
        id: o.id,
        name: o.trade_name ?? o.legal_name,
      })),
    [suppliersData]
  );

  const hasActiveFilters =
    sourcingTypeFilter !== 'all' ||
    (showStageFilter && stageFilter !== 'all') ||
    priorityFilter !== 'all' ||
    supplierFilter !== null ||
    searchTerm !== '';

  const resetFilters = () => {
    onSourcingTypeChange('all');
    onStageChange('all');
    onPriorityChange('all');
    onSupplierChange(null);
    onSearchChange('');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="h-11 pl-8 text-sm md:h-8 md:text-xs"
          />
        </div>

        <Select value={sourcingTypeFilter} onValueChange={onSourcingTypeChange}>
          <SelectTrigger className={TRIGGER}>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Type</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="interne">Interne</SelectItem>
          </SelectContent>
        </Select>

        {showStageFilter && (
          <Select value={stageFilter} onValueChange={onStageChange}>
            <SelectTrigger className={TRIGGER}>
              <SelectValue placeholder="Étape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Étape</SelectItem>
              {SOURCING_STAGES.map(stage => (
                <SelectItem key={stage} value={stage}>
                  {SOURCING_STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={priorityFilter} onValueChange={onPriorityChange}>
          <SelectTrigger className={TRIGGER}>
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Priorité</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={supplierFilter ?? 'all'}
          onValueChange={v => onSupplierChange(v === 'all' ? null : v)}
        >
          <SelectTrigger className={TRIGGER}>
            <SelectValue placeholder="Fournisseur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Fournisseur</SelectItem>
            {suppliers.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center gap-1 rounded px-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-black md:h-8 md:text-xs"
          >
            <X className="h-3 w-3" />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
