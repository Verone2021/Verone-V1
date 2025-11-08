'use client';

import { useState, useEffect } from 'react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSuppliers } from '@/shared/modules/organisations/hooks';

interface Supplier {
  id: string;
  name: string;
  type: string;
}

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

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-black">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Select
        value={selectedSupplierId || 'none'}
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
                  {supplier.trade_name || supplier.legal_name}
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

      {selectedSupplier && (
        <div className="text-xs text-gray-600 mt-1">
          Sélectionné:{' '}
          {selectedSupplier.trade_name || selectedSupplier.legal_name}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 mt-1">
          ⚠️ Impossible de charger les fournisseurs: {error}
        </div>
      )}
    </div>
  );
}

/**
 * Composant de sélection de fournisseurs réutilisable
 *
 * FONCTIONNALITÉS:
 * - Chargement automatique des fournisseurs via useSuppliers()
 * - Support des états loading, error, empty
 * - Option required avec validation visuelle
 * - Gestion du cas "aucun fournisseur"
 * - Affichage nom + type de fournisseur
 * - Interface cohérente avec CustomerSelector
 *
 * USAGE:
 * <SupplierSelector
 *   selectedSupplierId={formData.supplier_id}
 *   onSupplierChange={(id) => setFormData(prev => ({...prev, supplier_id: id}))}
 *   required={true}
 * />
 */
