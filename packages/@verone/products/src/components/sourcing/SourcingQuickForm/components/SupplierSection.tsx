'use client';

import { Label, Input, Checkbox } from '@verone/ui';
import { CountrySelect } from '@verone/ui';
import { cn } from '@verone/utils';

import { SupplierSelector } from '../../supplier-selector';
import type { NewSupplierState, SupplierMode } from '../types';

interface SupplierSectionProps {
  supplierMode: SupplierMode;
  onSupplierModeChange: (mode: SupplierMode) => void;
  supplierId: string;
  onSupplierIdChange: (id: string) => void;
  newSupplier: NewSupplierState;
  onNewSupplierChange: (updates: Partial<NewSupplierState>) => void;
  errors: Record<string, string>;
  onClearError: (key: string) => void;
}

export function SupplierSection({
  supplierMode,
  onSupplierModeChange,
  supplierId,
  onSupplierIdChange,
  newSupplier,
  onNewSupplierChange,
  errors,
  onClearError,
}: SupplierSectionProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Fournisseur</Label>

      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        {/* Radio: Existing supplier */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="supplier_mode"
            value="existing"
            checked={supplierMode === 'existing'}
            onChange={() => onSupplierModeChange('existing')}
            className="h-4 w-4 text-black accent-black"
          />
          <span className="text-sm font-medium">Fournisseur existant</span>
        </label>

        {supplierMode === 'existing' && (
          <div className="ml-7">
            <SupplierSelector
              selectedSupplierId={supplierId ?? null}
              onSupplierChange={id => {
                onSupplierIdChange(id ?? '');
              }}
              label=""
              placeholder="Sélectionner un fournisseur..."
              required={false}
            />
          </div>
        )}

        {/* Radio: New supplier */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="supplier_mode"
            value="new"
            checked={supplierMode === 'new'}
            onChange={() => onSupplierModeChange('new')}
            className="h-4 w-4 text-black accent-black"
          />
          <span className="text-sm font-medium">Nouveau fournisseur</span>
        </label>

        {supplierMode === 'new' && (
          <div className="ml-7 space-y-3">
            {/* Legal name */}
            <div className="space-y-1">
              <Label htmlFor="sf_legal_name" className="text-sm font-medium">
                Dénomination sociale *
              </Label>
              <Input
                id="sf_legal_name"
                value={newSupplier.legal_name}
                onChange={e => {
                  onNewSupplierChange({ legal_name: e.target.value });
                  if (errors.supplier_legal_name)
                    onClearError('supplier_legal_name');
                }}
                placeholder="Ex: Zentrada GmbH, Maisons du Monde SAS..."
                className={cn(
                  errors.supplier_legal_name &&
                    'border-red-300 focus:border-red-500'
                )}
              />
              {errors.supplier_legal_name && (
                <p className="text-sm text-red-600">
                  {errors.supplier_legal_name}
                </p>
              )}
            </div>

            {/* Checkbox trade name */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sf_has_different_trade_name"
                checked={newSupplier.has_different_trade_name}
                onCheckedChange={(checked: boolean) => {
                  onNewSupplierChange({
                    has_different_trade_name: checked,
                    trade_name: checked ? newSupplier.trade_name : '',
                  });
                  if (!checked && errors.supplier_trade_name) {
                    onClearError('supplier_trade_name');
                  }
                }}
              />
              <Label
                htmlFor="sf_has_different_trade_name"
                className="text-sm cursor-pointer"
              >
                Le nom commercial est différent
              </Label>
            </div>

            {/* Trade name (conditional) */}
            {newSupplier.has_different_trade_name && (
              <div className="space-y-1">
                <Label htmlFor="sf_trade_name" className="text-sm font-medium">
                  Nom commercial *
                </Label>
                <Input
                  id="sf_trade_name"
                  value={newSupplier.trade_name}
                  onChange={e => {
                    onNewSupplierChange({ trade_name: e.target.value });
                    if (errors.supplier_trade_name)
                      onClearError('supplier_trade_name');
                  }}
                  placeholder="Ex: Zentrada, MdM..."
                  className={cn(
                    errors.supplier_trade_name &&
                      'border-red-300 focus:border-red-500'
                  )}
                />
                {errors.supplier_trade_name && (
                  <p className="text-sm text-red-600">
                    {errors.supplier_trade_name}
                  </p>
                )}
              </div>
            )}

            {/* Website */}
            <div className="space-y-1">
              <Label htmlFor="sf_website" className="text-sm font-medium">
                Site web *
              </Label>
              <Input
                id="sf_website"
                type="url"
                value={newSupplier.website}
                onChange={e => {
                  onNewSupplierChange({ website: e.target.value });
                  if (errors.supplier_website) onClearError('supplier_website');
                }}
                placeholder="https://www.fournisseur.com"
                className={cn(
                  errors.supplier_website &&
                    'border-red-300 focus:border-red-500'
                )}
              />
              {errors.supplier_website && (
                <p className="text-sm text-red-600">
                  {errors.supplier_website}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Pays</Label>
              <CountrySelect
                value={newSupplier.country}
                onChange={value => {
                  onNewSupplierChange({ country: value || 'FR' });
                }}
                placeholder="Sélectionner un pays"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
