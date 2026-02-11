'use client';

import { useState, useMemo } from 'react';

import { useOrganisations } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Separator } from '@verone/ui';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import { SlidersHorizontal, X } from 'lucide-react';

import type { PurchaseAdvancedFilters } from '../../types/advanced-filters';
import {
  DEFAULT_PURCHASE_FILTERS,
  countActiveFilters,
} from '../../types/advanced-filters';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'validated', label: 'Validée' },
  { value: 'partially_received', label: 'Part. reçue' },
  { value: 'received', label: 'Reçue' },
  { value: 'cancelled', label: 'Annulée' },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Toute période' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' },
];

const MATCHING_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'matched', label: 'Rapprochées' },
  { value: 'unmatched', label: 'Non rapprochées' },
];

interface AdvancedPurchaseFiltersModalProps {
  filters: PurchaseAdvancedFilters;
  onApply: (filters: PurchaseAdvancedFilters) => void;
}

export function AdvancedPurchaseFiltersModal({
  filters,
  onApply,
}: AdvancedPurchaseFiltersModalProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<PurchaseAdvancedFilters>(filters);

  const { organisations: suppliers } = useOrganisations({ type: 'supplier' });

  const activeCount = useMemo(
    () => countActiveFilters(filters, DEFAULT_PURCHASE_FILTERS),
    [filters]
  );

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocal({ ...filters });
    }
    setOpen(isOpen);
  };

  const handleApply = () => {
    onApply(local);
    setOpen(false);
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_PURCHASE_FILTERS });
  };

  const toggleStatus = (status: string) => {
    setLocal(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <ButtonUnified variant="outline" icon={SlidersHorizontal}>
          Filtres
          {activeCount > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {activeCount}
            </Badge>
          )}
        </ButtonUnified>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Filtres avancés
            {activeCount > 0 && (
              <ButtonUnified
                variant="ghost"
                size="sm"
                onClick={handleReset}
                icon={X}
              >
                Réinitialiser
              </ButtonUnified>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section: Statuts (multi-select) */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Statuts commande</Label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={local.statuses.includes(opt.value)}
                    onCheckedChange={() => toggleStatus(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Section: Fournisseur */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Fournisseur</Label>
            <Select
              value={local.supplierId ?? 'all'}
              onValueChange={value =>
                setLocal(prev => ({
                  ...prev,
                  supplierId: value === 'all' ? null : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les fournisseurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {getOrganisationDisplayName(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Section: Période */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Période</Label>
            <Select
              value={local.period}
              onValueChange={value =>
                setLocal(prev => ({
                  ...prev,
                  period: value as PurchaseAdvancedFilters['period'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Section: Montant HT */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Montant HT (€)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="Min"
                value={local.amountMin ?? ''}
                onChange={e =>
                  setLocal(prev => ({
                    ...prev,
                    amountMin: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="number"
                placeholder="Max"
                value={local.amountMax ?? ''}
                onChange={e =>
                  setLocal(prev => ({
                    ...prev,
                    amountMax: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* Section: Rapprochement bancaire */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Rapprochement bancaire
            </Label>
            <Select
              value={local.matching}
              onValueChange={value =>
                setLocal(prev => ({
                  ...prev,
                  matching: value as PurchaseAdvancedFilters['matching'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATCHING_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <ButtonUnified variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </ButtonUnified>
          <ButtonUnified onClick={handleApply}>
            Appliquer les filtres
          </ButtonUnified>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
