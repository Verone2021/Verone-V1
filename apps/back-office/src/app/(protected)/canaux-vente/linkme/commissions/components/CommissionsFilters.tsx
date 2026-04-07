'use client';

import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Search, X } from 'lucide-react';

import type { Affiliate } from '../types';

interface Enseigne {
  id: string;
  name: string;
}

interface CommissionsFiltersProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterYear: number | null;
  onYearChange: (v: number | null) => void;
  availableYears: number[];
  typeFilter: string;
  onTypeChange: (v: string) => void;
  enseigneFilter: string;
  onEnseigneChange: (v: string) => void;
  enseignes: Enseigne[];
  affiliateFilter: string;
  onAffiliateChange: (v: string) => void;
  affiliates: Affiliate[];
  hasActiveFilters: boolean;
  onReset: () => void;
}

export function CommissionsFilters({
  searchTerm,
  onSearchChange,
  filterYear,
  onYearChange,
  availableYears,
  typeFilter,
  onTypeChange,
  enseigneFilter,
  onEnseigneChange,
  enseignes,
  affiliateFilter,
  onAffiliateChange,
  affiliates,
  hasActiveFilters,
  onReset,
}: CommissionsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par N° commande..."
          value={searchTerm}
          onChange={e => {
            onSearchChange(e.target.value);
          }}
          className="pl-10"
        />
      </div>
      <Select
        value={filterYear === null ? 'all' : String(filterYear)}
        onValueChange={v => {
          onYearChange(v === 'all' ? null : Number(v));
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Année" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les années</SelectItem>
          {availableYears.map(year => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={typeFilter}
        onValueChange={v => {
          onTypeChange(v);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="enseigne">Enseigne</SelectItem>
          <SelectItem value="organisation">Organisation</SelectItem>
        </SelectContent>
      </Select>
      {typeFilter !== 'organisation' && (
        <Select
          value={enseigneFilter}
          onValueChange={v => {
            onEnseigneChange(v);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Enseigne" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les enseignes</SelectItem>
            {enseignes.map(enseigne => (
              <SelectItem key={enseigne.id} value={enseigne.id}>
                {enseigne.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select
        value={affiliateFilter}
        onValueChange={v => {
          onAffiliateChange(v);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Affilié" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les affiliés</SelectItem>
          {affiliates.map(affiliate => (
            <SelectItem key={affiliate.id} value={affiliate.id}>
              {affiliate.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-10 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Réinitialiser
        </ButtonV2>
      )}
    </div>
  );
}
