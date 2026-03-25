/**
 * ⚡ QuickVariantForm - Formulaire minimaliste pour créer un produit variante
 *
 * Création rapide de produit dans un groupe de variantes
 * Nom auto-généré + données minimales comme demandé
 */

'use client';

import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Save, Loader2, Euro } from 'lucide-react';

import { type VariantType } from './quick-variant-form-constants';
import {
  ImageUploadSection,
  VariantField,
} from './quick-variant-form-sections';
import {
  useQuickVariantForm,
  type QuickVariantFormData,
  type CreatedProduct,
} from './use-quick-variant-form';

export type { CreatedProduct };

interface QuickVariantFormProps {
  isOpen: boolean;
  onClose: () => void;
  variantGroupId: string;
  baseProductId: string;
  groupName: string;
  variantType: VariantType;
  onProductCreated: (product: CreatedProduct) => void;
}

// ---------------------------------------------------------------------------
// CostPriceField
// ---------------------------------------------------------------------------

interface CostPriceFieldProps {
  value: number;
  onChange: (value: number) => void;
}

function CostPriceField({ value, onChange }: CostPriceFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="cost_price"
        className="text-black flex items-center space-x-2"
      >
        <Euro className="h-4 w-4" />
        <span>Prix d'achat*</span>
      </Label>
      <Input
        id="cost_price"
        type="number"
        step="0.01"
        min="0"
        value={value ?? ''}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0.00"
        className="border-gray-300 focus:border-black"
        required
      />
      {value > 0 && (
        <p className="text-xs text-gray-500">
          Prix de vente estimé (marge 50%): {(value * 1.5).toFixed(2)}€ HT
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VariantAttributesSection
// ---------------------------------------------------------------------------

interface VariantAttributesSectionProps {
  variantType: VariantType;
  formData: QuickVariantFormData;
  onColorChange: (value: string) => void;
  onFieldChange: (field: keyof QuickVariantFormData, value: string) => void;
}

function VariantAttributesSection({
  variantType,
  formData,
  onColorChange,
  onFieldChange,
}: VariantAttributesSectionProps) {
  return (
    <div className="space-y-4">
      {/* FIXME: DynamicColorSelector component doesn't exist in @verone/ui */}
      <div>
        <Label>Couleur</Label>
        <Input
          value={formData.color}
          onChange={e => onColorChange(e.target.value)}
          placeholder="Rechercher ou créer une couleur..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <VariantField
          type="size"
          value={formData.size}
          onChange={v => onFieldChange('size', v)}
          variantType={variantType}
        />
        <VariantField
          type="material"
          value={formData.material}
          onChange={v => onFieldChange('material', v)}
          variantType={variantType}
        />
        <VariantField
          type="pattern"
          value={formData.pattern}
          onChange={v => onFieldChange('pattern', v)}
          variantType={variantType}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormActions
// ---------------------------------------------------------------------------

interface FormActionsProps {
  loading: boolean;
  uploadingImage: boolean;
  onClose: () => void;
}

function FormActions({ loading, uploadingImage, onClose }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-4 pt-4">
      <ButtonV2
        type="button"
        variant="outline"
        onClick={onClose}
        className="border-gray-300 hover:bg-gray-50"
      >
        Annuler
      </ButtonV2>
      <ButtonV2
        type="submit"
        disabled={loading || uploadingImage}
        className="bg-black hover:bg-gray-800 text-white"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Créer la variante
      </ButtonV2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VariantFormBody
// ---------------------------------------------------------------------------

interface VariantFormBodyProps {
  variantType: VariantType;
  formData: QuickVariantFormData;
  loading: boolean;
  uploadingImage: boolean;
  productName: string;
  onColorChange: (value: string) => void;
  onFieldChange: (field: keyof QuickVariantFormData, value: string) => void;
  onCostPriceChange: (value: number) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove: () => void;
}

function VariantFormBody({
  variantType,
  formData,
  loading,
  uploadingImage,
  productName,
  onColorChange,
  onFieldChange,
  onCostPriceChange,
  onSubmit,
  onClose,
  onImageUpload,
  onImageRemove,
}: VariantFormBodyProps) {
  return (
    <form
      onSubmit={e => {
        void onSubmit(e);
      }}
      className="space-y-6"
    >
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Label className="text-blue-900 text-sm font-medium">
          Nom du produit (auto-généré)
        </Label>
        <p className="text-blue-700 mt-1">{productName}</p>
      </div>
      <VariantAttributesSection
        variantType={variantType}
        formData={formData}
        onColorChange={onColorChange}
        onFieldChange={onFieldChange}
      />
      <CostPriceField
        value={formData.cost_price}
        onChange={onCostPriceChange}
      />
      <ImageUploadSection
        imageUrl={formData.image_url}
        uploadingImage={uploadingImage}
        onUpload={onImageUpload}
        onRemove={onImageRemove}
      />
      <FormActions
        loading={loading}
        uploadingImage={uploadingImage}
        onClose={onClose}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// QuickVariantForm — thin wrapper
// ---------------------------------------------------------------------------

export function QuickVariantForm({
  isOpen,
  onClose,
  variantGroupId,
  baseProductId,
  groupName,
  variantType,
  onProductCreated,
}: QuickVariantFormProps) {
  const {
    loading,
    uploadingImage,
    formData,
    setFormData,
    generateProductName,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
  } = useQuickVariantForm({
    isOpen,
    variantGroupId,
    baseProductId,
    groupName,
    onProductCreated,
    onClose,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">
            Créer une variante rapide
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Groupe: <strong>{groupName}</strong> • Type principal:{' '}
            <strong className="capitalize">{variantType}</strong>
          </p>
        </DialogHeader>
        <VariantFormBody
          variantType={variantType}
          formData={formData}
          loading={loading}
          uploadingImage={uploadingImage}
          productName={generateProductName()}
          onColorChange={value =>
            setFormData(prev => ({ ...prev, color: value }))
          }
          onFieldChange={(field, value) =>
            setFormData(prev => ({ ...prev, [field]: value }))
          }
          onCostPriceChange={value =>
            setFormData(prev => ({ ...prev, cost_price: value }))
          }
          onSubmit={handleSubmit}
          onClose={onClose}
          onImageUpload={handleImageUpload}
          onImageRemove={handleRemoveImage}
        />
      </DialogContent>
    </Dialog>
  );
}
