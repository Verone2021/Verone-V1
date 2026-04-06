'use client';

import Link from 'next/link';

import {
  Checkbox,
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
  legal_name?: string | null;
  trade_name?: string | null;
}

interface VariantGroupSupplierSectionProps {
  hasCommonSupplier: boolean;
  supplierId: string;
  onHasCommonSupplierChange: (value: boolean) => void;
  onSupplierIdChange: (value: string) => void;
  suppliers: Supplier[];
  suppliersLoading: boolean;
}

export function VariantGroupSupplierSection({
  hasCommonSupplier,
  supplierId,
  onHasCommonSupplierChange,
  onSupplierIdChange,
  suppliers,
  suppliersLoading,
}: VariantGroupSupplierSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="has-common-supplier"
          checked={hasCommonSupplier}
          onCheckedChange={checked => {
            onHasCommonSupplierChange(checked as boolean);
            if (!checked) onSupplierIdChange('');
          }}
        />
        <Label
          htmlFor="has-common-supplier"
          className="text-sm font-medium cursor-pointer"
        >
          🏢 Même fournisseur pour tous les produits
        </Label>
      </div>
      <p className="text-xs text-gray-600 ml-6">
        Si cochée, tous les produits du groupe hériteront automatiquement du
        fournisseur sélectionné
      </p>

      {hasCommonSupplier && (
        <div className="ml-6 space-y-2">
          <Label htmlFor="supplier" className="text-sm font-medium">
            Fournisseur commun <span className="text-red-500">*</span>
          </Label>
          <Select
            value={supplierId}
            onValueChange={onSupplierIdChange}
            disabled={suppliersLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un fournisseur" />
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
            <Link
              href={`/contacts-organisations/suppliers/${supplierId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Voir la fiche détail du fournisseur
            </Link>
          )}
          <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
            💡 Ce fournisseur sera appliqué automatiquement à tous les produits
            du groupe
          </p>
        </div>
      )}
    </div>
  );
}
