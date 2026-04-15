'use client';

import { useState, useEffect } from 'react';

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Search, X } from 'lucide-react';

const PIPELINE_STATUSES = [
  { value: 'all', label: 'Pipeline' },
  { value: 'need_identified', label: 'Besoin identifié' },
  { value: 'supplier_search', label: 'Recherche fournisseur' },
  { value: 'initial_contact', label: 'Premier contact' },
  { value: 'evaluation', label: 'Évaluation' },
  { value: 'negotiation', label: 'Négociation' },
  { value: 'sample_requested', label: 'Échantillon demandé' },
  { value: 'sample_received', label: 'Échantillon reçu' },
  { value: 'sample_approved', label: 'Échantillon validé' },
  { value: 'sample_rejected', label: 'Échantillon refusé' },
  { value: 'order_placed', label: 'Commande passée' },
  { value: 'received', label: 'Reçu' },
  { value: 'on_hold', label: 'En pause' },
  { value: 'cancelled', label: 'Annulé' },
] as const;

interface SourcingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sourcingTypeFilter: string;
  onSourcingTypeChange: (value: string) => void;
  supplierFilter: string | null;
  onSupplierChange: (id: string | null) => void;
  pipelineFilter: string;
  onPipelineChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
}

interface SupplierOption {
  id: string;
  name: string;
}

export function SourcingFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sourcingTypeFilter,
  onSourcingTypeChange,
  supplierFilter,
  onSupplierChange,
  pipelineFilter,
  onPipelineChange,
  priorityFilter,
  onPriorityChange,
}: SourcingFiltersProps) {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('organisations')
        .select('id, trade_name, legal_name')
        .eq('type', 'supplier')
        .order('trade_name', { ascending: true })
        .limit(100);

      if (data) {
        setSuppliers(
          data.map(o => ({
            id: o.id,
            name: o.trade_name ?? o.legal_name,
          }))
        );
      }
    };
    void fetchSuppliers().catch(console.error);
  }, []);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    sourcingTypeFilter !== 'all' ||
    pipelineFilter !== 'all' ||
    priorityFilter !== 'all' ||
    supplierFilter !== null;

  const resetFilters = () => {
    onStatusChange('all');
    onSourcingTypeChange('all');
    onPipelineChange('all');
    onPriorityChange('all');
    onSupplierChange(null);
    onSearchChange('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search — taille réduite */}
        <div className="relative w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Statut */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-auto min-w-[110px] h-8 text-xs gap-1">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Statut</SelectItem>
            <SelectItem value="draft">En sourcing</SelectItem>
            <SelectItem value="preorder">Échantillon</SelectItem>
            <SelectItem value="active">Au catalogue</SelectItem>
          </SelectContent>
        </Select>

        {/* Type */}
        <Select value={sourcingTypeFilter} onValueChange={onSourcingTypeChange}>
          <SelectTrigger className="w-auto min-w-[90px] h-8 text-xs gap-1">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Type</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="interne">Interne</SelectItem>
          </SelectContent>
        </Select>

        {/* Pipeline */}
        <Select value={pipelineFilter} onValueChange={onPipelineChange}>
          <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs gap-1">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priorité */}
        <Select value={priorityFilter} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs gap-1">
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

        {/* Fournisseur — même style Select */}
        <Select
          value={supplierFilter ?? 'all'}
          onValueChange={v => onSupplierChange(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs gap-1">
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

        {/* Reset */}
        {hasActiveFilters && (
          <>
            <div className="h-5 w-px bg-gray-200" />
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="h-3 w-3" />
              Réinitialiser
            </button>
          </>
        )}
      </div>
    </div>
  );
}
