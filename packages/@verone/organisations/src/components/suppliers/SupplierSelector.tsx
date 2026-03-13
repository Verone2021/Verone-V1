'use client';

import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { useSuppliers } from '@verone/organisations/hooks';

interface SupplierSelectorProps {
  selectedSupplierId: string | null;
  onSupplierChange: (supplierId: string | null) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function SupplierSelector({
  selectedSupplierId,
  onSupplierChange,
  disabled = false,
  required = false,
  label = 'Fournisseur',
  placeholder = 'Sélectionner un fournisseur',
  className,
}: SupplierSelectorProps) {
  const { organisations: suppliers, loading, error } = useSuppliers();

  const handleSupplierChange = (value: string) => {
    if (value === 'none') {
      onSupplierChange(null);
    } else {
      onSupplierChange(value);
    }
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-black">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Select
        value={selectedSupplierId ?? 'none'}
        onValueChange={handleSupplierChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full mt-1">
          <SelectValue placeholder={loading ? 'Chargement...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value="none">
              <span className="text-gray-500">Aucun fournisseur</span>
            </SelectItem>
          )}

          {loading && (
            <SelectItem value="loading" disabled>
              <span className="text-gray-500">
                Chargement des fournisseurs...
              </span>
            </SelectItem>
          )}

          {error && (
            <SelectItem value="error" disabled>
              <span className="text-red-500">Erreur: {error}</span>
            </SelectItem>
          )}

          {suppliers.map(supplier => (
            <SelectItem key={supplier.id} value={supplier.id}>
              <div className="flex items-center">
                <span className="font-medium">
                  {supplier.trade_name ?? supplier.legal_name}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({supplier.type})
                </span>
              </div>
            </SelectItem>
          ))}

          {!loading && suppliers.length === 0 && !error && (
            <SelectItem value="empty" disabled>
              <span className="text-gray-500">
                Aucun fournisseur disponible
              </span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {error && (
        <div className="text-xs text-red-600 mt-1">
          Impossible de charger les fournisseurs: {error}
        </div>
      )}
    </div>
  );
}
