'use client';

import { useState } from 'react';

import {
  UniversalProductSelectorV2,
  type SelectedProduct,
} from '@verone/products';
import { ProductThumbnail } from '@verone/products';
import { ButtonV2 } from '@verone/ui';
import { ImageUploadZone } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Package, X } from 'lucide-react';

import type {
  Product,
  StockAdjustmentFormData,
} from './use-stock-adjustment-form';

// =====================================================================
// CONSTANTES
// =====================================================================

const ADJUSTMENT_TYPES = [
  { value: 'increase', label: 'Augmentation stock' },
  { value: 'decrease', label: 'Diminution stock' },
  { value: 'correction', label: 'Correction inventaire' },
] as const;

const ADJUSTMENT_REASONS = [
  { value: 'inventory_count', label: 'Inventaire physique' },
  { value: 'damage', label: 'Casse / Détérioration' },
  { value: 'loss', label: 'Perte / Vol' },
  { value: 'found', label: 'Produit retrouvé' },
  { value: 'correction', label: 'Correction erreur saisie' },
  { value: 'other', label: 'Autre raison' },
] as const;

// =====================================================================
// FIELD PROPS
// =====================================================================

interface FieldProps {
  formData: StockAdjustmentFormData;
  loading: boolean;
}

interface ProductFieldProps extends FieldProps {
  products: Product[];
  loadingProducts: boolean;
  selectedProduct: Product | null;
  onProductChange: (productId: string) => void;
}

interface AdjustmentTypeFieldProps extends FieldProps {
  onChange: (value: StockAdjustmentFormData['adjustment_type']) => void;
}

interface QuantityFieldProps extends FieldProps {
  selectedProduct: Product | null;
  calculateQuantityChange: () => number;
  onChange: (quantity: number) => void;
}

interface ReasonFieldProps extends FieldProps {
  onChange: (value: StockAdjustmentFormData['reason']) => void;
}

interface DateFieldProps extends FieldProps {
  onChange: (value: string) => void;
}

interface NotesFieldProps extends FieldProps {
  onChange: (value: string) => void;
}

interface FileUploadFieldProps {
  onUploadSuccess: (url: string, fileName: string) => void;
}

// =====================================================================
// SOUS-COMPOSANTS
// =====================================================================

export function ProductField({
  formData: _formData,
  loading,
  selectedProduct,
  onProductChange,
}: Omit<ProductFieldProps, 'products' | 'loadingProducts'>) {
  const [selectorOpen, setSelectorOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>
        Produit <span className="text-red-500">*</span>
      </Label>

      {selectedProduct ? (
        <SelectedProductCard
          product={selectedProduct}
          onClear={() => onProductChange('')}
          disabled={loading}
        />
      ) : (
        <ButtonV2
          type="button"
          variant="outline"
          className="w-full justify-start h-auto py-3"
          onClick={() => setSelectorOpen(true)}
          disabled={loading}
        >
          <Package className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-gray-500">
            Sélectionner un produit (avec images)...
          </span>
        </ButtonV2>
      )}

      <UniversalProductSelectorV2
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        mode="single"
        showImages
        showPricing={false}
        onSelect={(products: SelectedProduct[]) => {
          if (products.length > 0 && products[0]) {
            onProductChange(products[0].id);
          }
          setSelectorOpen(false);
        }}
      />
    </div>
  );
}

function SelectedProductCard({
  product,
  onClear,
  disabled,
}: {
  product: Product;
  onClear: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-md bg-gray-50">
      <ProductThumbnail src={null} alt={product.name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{product.name}</p>
        <p className="text-xs text-gray-500">
          {product.sku} — Stock réel: <strong>{product.stock_real}</strong>{' '}
          unités
        </p>
      </div>
      <ButtonV2
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={disabled}
      >
        <X className="h-4 w-4" />
      </ButtonV2>
    </div>
  );
}

export function AdjustmentTypeField({
  formData,
  loading,
  onChange,
}: AdjustmentTypeFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="adjustment_type">
        Type d&apos;ajustement <span className="text-red-500">*</span>
      </Label>
      <Select
        value={formData.adjustment_type}
        onValueChange={onChange}
        disabled={loading}
      >
        <SelectTrigger id="adjustment_type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ADJUSTMENT_TYPES.map(type => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function QuantityField({
  formData,
  loading,
  selectedProduct,
  calculateQuantityChange,
  onChange,
}: QuantityFieldProps) {
  const quantityChange = calculateQuantityChange();
  const label =
    formData.adjustment_type === 'correction'
      ? 'Nouvelle quantité cible'
      : 'Quantité à ajuster';

  return (
    <div className="space-y-2">
      <Label htmlFor="quantity">
        {label} <span className="text-red-500">*</span>
      </Label>
      <Input
        id="quantity"
        type="number"
        min={0}
        value={formData.quantity}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        disabled={loading}
        required
      />
      {formData.adjustment_type === 'correction' && selectedProduct && (
        <p className="text-sm text-gray-500">
          Différence:{' '}
          <strong>
            {quantityChange > 0 ? '+' : ''}
            {quantityChange}
          </strong>{' '}
          unités
        </p>
      )}
    </div>
  );
}

export function ReasonField({ formData, loading, onChange }: ReasonFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="reason">
        Raison <span className="text-red-500">*</span>
      </Label>
      <Select
        value={formData.reason}
        onValueChange={onChange}
        disabled={loading}
      >
        <SelectTrigger id="reason">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ADJUSTMENT_REASONS.map(reason => (
            <SelectItem key={reason.value} value={reason.value}>
              {reason.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DateField({ formData, loading, onChange }: DateFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="adjustment_date">
        Date ajustement <span className="text-red-500">*</span>
      </Label>
      <Input
        id="adjustment_date"
        type="date"
        value={formData.adjustment_date}
        onChange={e => onChange(e.target.value)}
        disabled={loading}
        required
      />
    </div>
  );
}

export function NotesField({ formData, loading, onChange }: NotesFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notes </Label>
      <Textarea
        id="notes"
        value={formData.notes}
        onChange={e => onChange(e.target.value)}
        placeholder="Détails sur l'ajustement..."
        rows={3}
        disabled={loading}
        required={formData.reason === 'other'}
      />
    </div>
  );
}

export function JustificatifField({ onUploadSuccess }: FileUploadFieldProps) {
  return (
    <ImageUploadZone
      bucket="stock-adjustments"
      folder={`adjustments/${new Date().getFullYear()}/${String(
        new Date().getMonth() + 1
      ).padStart(2, '0')}`}
      onUploadSuccess={onUploadSuccess}
      label="Document justificatif (optionnel)"
      helperText="Ajoutez une photo ou PDF justifiant l'ajustement"
      acceptedFormats={{
        'image/*': ['.png', '.jpg', '.jpeg'],
        'application/pdf': ['.pdf'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
          '.xlsx',
        ],
      }}
    />
  );
}

// =====================================================================
// COMPOSANT AGREGATEUR (tous les champs du formulaire)
// =====================================================================

interface AdjustmentFormFieldsProps {
  formData: StockAdjustmentFormData;
  setFormData: (data: StockAdjustmentFormData) => void;
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  loadingProducts: boolean;
  onProductChange: (productId: string) => void;
  calculateQuantityChange: () => number;
  onFileUpload: (url: string, fileName: string) => void;
}

export function AdjustmentFormFields({
  formData,
  setFormData,
  products: _products,
  selectedProduct,
  loading,
  loadingProducts: _loadingProducts,
  onProductChange,
  calculateQuantityChange,
  onFileUpload,
}: AdjustmentFormFieldsProps) {
  return (
    <>
      <ProductField
        formData={formData}
        loading={loading}
        selectedProduct={selectedProduct}
        onProductChange={onProductChange}
      />
      <AdjustmentTypeField
        formData={formData}
        loading={loading}
        onChange={value => setFormData({ ...formData, adjustment_type: value })}
      />
      <QuantityField
        formData={formData}
        loading={loading}
        selectedProduct={selectedProduct}
        calculateQuantityChange={calculateQuantityChange}
        onChange={quantity => setFormData({ ...formData, quantity })}
      />
      <ReasonField
        formData={formData}
        loading={loading}
        onChange={value => setFormData({ ...formData, reason: value })}
      />
      <DateField
        formData={formData}
        loading={loading}
        onChange={value => setFormData({ ...formData, adjustment_date: value })}
      />
      <NotesField
        formData={formData}
        loading={loading}
        onChange={value => setFormData({ ...formData, notes: value })}
      />
      <JustificatifField onUploadSuccess={onFileUpload} />
    </>
  );
}
