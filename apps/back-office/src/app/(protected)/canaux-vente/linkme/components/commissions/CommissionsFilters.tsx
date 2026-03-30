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
import { CheckCircle, CreditCard, Search } from 'lucide-react';

import type { AffiliateOption } from './types';

interface CommissionsFiltersProps {
  searchTerm: string;
  affiliateFilter: string;
  statusFilter: string;
  affiliates: AffiliateOption[];
  onSearchChange: (value: string) => void;
  onAffiliateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

interface BulkActionsBarProps {
  selectedCount: number;
  processing: boolean;
  onValidate: () => void;
  onMarkPaid: () => void;
}

export function CommissionsFilters({
  searchTerm,
  affiliateFilter,
  statusFilter,
  affiliates,
  onSearchChange,
  onAffiliateChange,
  onStatusChange,
}: CommissionsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par commande..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={affiliateFilter} onValueChange={onAffiliateChange}>
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
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="validated">Validées</SelectItem>
          <SelectItem value="paid">Payées</SelectItem>
          <SelectItem value="cancelled">Annulées</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function BulkActionsBar({
  selectedCount,
  processing,
  onValidate,
  onMarkPaid,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} sélectionnée(s)
      </span>
      <ButtonV2
        size="sm"
        variant="outline"
        onClick={onValidate}
        disabled={processing}
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Valider
      </ButtonV2>
      <ButtonV2
        size="sm"
        variant="outline"
        onClick={onMarkPaid}
        disabled={processing}
      >
        <CreditCard className="h-4 w-4 mr-1" />
        Marquer payé
      </ButtonV2>
    </div>
  );
}
