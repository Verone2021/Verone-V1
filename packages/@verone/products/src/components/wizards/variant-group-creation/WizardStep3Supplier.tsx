'use client';

import Link from 'next/link';

import {
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { ExternalLink } from 'lucide-react';

interface Supplier {
  id: string;
  legal_name: string;
  trade_name: string | null;
}

interface WizardStep3SupplierProps {
  hasCommonSupplier: boolean;
  supplierId: string;
  commonWeight: number | '';
  suppliers: Supplier[];
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function WizardStep3Supplier({
  hasCommonSupplier,
  supplierId,
  commonWeight,
  suppliers,
  onUpdate,
}: WizardStep3SupplierProps) {
  return (
    <div className="space-y-4">
      {/* Fournisseur commun */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-common-supplier"
            checked={hasCommonSupplier}
            onCheckedChange={checked => {
              onUpdate({ has_common_supplier: checked as boolean });
              if (!checked) onUpdate({ supplier_id: '' });
            }}
          />
          <Label
            htmlFor="has-common-supplier"
            className="text-sm font-medium cursor-pointer"
          >
            Meme fournisseur pour tous les produits
          </Label>
        </div>

        {hasCommonSupplier && (
          <div>
            <Label htmlFor="supplier">
              Fournisseur <span className="text-red-500">*</span>
            </Label>
            <Select
              value={supplierId}
              onValueChange={value => onUpdate({ supplier_id: value })}
            >
              <SelectTrigger id="supplier" className="mt-1">
                <SelectValue placeholder="Selectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.legal_name ?? supplier.trade_name ?? 'Sans nom'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supplierId && (
              <div className="mt-2">
                <Link
                  href={`/contacts-organisations/${supplierId}`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Voir fiche fournisseur
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Ce fournisseur sera automatiquement assigne a tous les produits du
              groupe
            </p>
          </div>
        )}
      </div>

      {/* Poids commun */}
      <div>
        <Label htmlFor="common_weight">Poids commun (kg)</Label>
        <Input
          id="common_weight"
          type="number"
          value={commonWeight}
          onChange={e =>
            onUpdate({
              common_weight: e.target.value ? Number(e.target.value) : '',
            })
          }
          placeholder="Ex: 12.5"
          min="0"
          step="0.1"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Poids partage par tous les produits (optionnel)
        </p>
      </div>
    </div>
  );
}
