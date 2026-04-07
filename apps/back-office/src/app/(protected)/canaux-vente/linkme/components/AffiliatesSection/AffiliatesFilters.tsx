'use client';

import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Building2, Search, Store } from 'lucide-react';

import type { Enseigne, Organisation } from './types';

interface AffiliatesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  enseigneFilter: string;
  onEnseigneFilterChange: (value: string) => void;
  organisationFilter: string;
  onOrganisationFilterChange: (value: string) => void;
  enseignes: Enseigne[];
  organisations: Organisation[];
}

export function AffiliatesFilters({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  enseigneFilter,
  onEnseigneFilterChange,
  organisationFilter,
  onOrganisationFilterChange,
  enseignes,
  organisations,
}: AffiliatesFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="enseigne">Enseignes</SelectItem>
          <SelectItem value="client_professionnel">Clients Pro</SelectItem>
          <SelectItem value="client_particulier">Particuliers</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="active">Actifs</SelectItem>
          <SelectItem value="suspended">Suspendus</SelectItem>
        </SelectContent>
      </Select>
      <Select value={enseigneFilter} onValueChange={onEnseigneFilterChange}>
        <SelectTrigger className="w-[180px]">
          <Building2 className="h-4 w-4 mr-2" />
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
      <Select
        value={organisationFilter}
        onValueChange={onOrganisationFilterChange}
      >
        <SelectTrigger className="w-[180px]">
          <Store className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Organisation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les organisations</SelectItem>
          {organisations.map(org => (
            <SelectItem key={org.id} value={org.id}>
              {org.trade_name ?? org.legal_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
