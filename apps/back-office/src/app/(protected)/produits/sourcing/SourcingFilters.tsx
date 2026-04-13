'use client';

import { SupplierSelector } from '@verone/products/components/sourcing/supplier-selector';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { Search } from 'lucide-react';

const PIPELINE_STATUSES = [
  { value: 'all', label: 'Tous les pipelines' },
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
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: colors.text.DEFAULT }}>
          Filtres et Recherche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Row 1: Search + Status + Type + Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-3 h-4 w-4"
              style={{ color: colors.text.muted }}
            />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10"
              style={{ borderColor: colors.border.DEFAULT }}
            />
          </div>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger style={{ borderColor: colors.border.DEFAULT }}>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">En sourcing</SelectItem>
              <SelectItem value="preorder">Échantillon commandé</SelectItem>
              <SelectItem value="active">Au catalogue</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sourcingTypeFilter}
            onValueChange={onSourcingTypeChange}
          >
            <SelectTrigger style={{ borderColor: colors.border.DEFAULT }}>
              <SelectValue placeholder="Type sourcing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="interne">Interne</SelectItem>
            </SelectContent>
          </Select>

          <SupplierSelector
            selectedSupplierId={supplierFilter}
            onSupplierChange={onSupplierChange}
            label=""
            placeholder="Tous les fournisseurs"
            required={false}
          />
        </div>

        {/* Row 2: Pipeline status + Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={pipelineFilter} onValueChange={onPipelineChange}>
            <SelectTrigger style={{ borderColor: colors.border.DEFAULT }}>
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

          <Select value={priorityFilter} onValueChange={onPriorityChange}>
            <SelectTrigger style={{ borderColor: colors.border.DEFAULT }}>
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les priorités</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
