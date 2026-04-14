'use client';

import { useState, useEffect } from 'react';

import {
  Settings,
  Save,
  Ruler,
  Weight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { Alert, AlertDescription } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';

import { ProductVariantAttributesForm } from './product-characteristics/ProductVariantAttributesForm';
import { ProductCustomAttributesForm } from './product-characteristics/ProductCustomAttributesForm';

interface ProductCharacteristicsUpdate {
  variant_attributes: Record<string, string | string[]> | null;
  dimensions: Record<string, number> | null;
  weight: number | null;
  updated_at: string;
}

interface ProductCharacteristicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  initialData?: {
    variant_attributes?: Record<string, unknown>;
    dimensions?: Record<string, unknown>;
    weight?: number;
  };
  onUpdate: (data: ProductCharacteristicsUpdate) => void;
}

const DIMENSION_FIELDS = [
  { key: 'width', label: 'Largeur', unit: 'cm' },
  { key: 'height', label: 'Hauteur', unit: 'cm' },
  { key: 'depth', label: 'Profondeur', unit: 'cm' },
];

const PREDEFINED_KEYS = ['color', 'material', 'style', 'finish'];

export function ProductCharacteristicsModal({
  isOpen,
  onClose,
  productId,
  productName,
  initialData,
  onUpdate,
}: ProductCharacteristicsModalProps) {
  const supabase = createClient();

  const [variantAttributes, setVariantAttributes] = useState<
    Record<string, string>
  >({});
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [weight, setWeight] = useState<number | undefined>();
  const [customAttributes, setCustomAttributes] = useState<
    Record<string, string>
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');

  useEffect(() => {
    if (initialData) {
      const variants = initialData.variant_attributes ?? {};
      const predefined: Record<string, string> = {};
      const custom: Record<string, string> = {};

      Object.entries(variants).forEach(([key, value]) => {
        if (PREDEFINED_KEYS.includes(key)) {
          predefined[key] = String(value);
        } else {
          custom[key] = String(value);
        }
      });

      setVariantAttributes(predefined);
      setCustomAttributes(custom);
      setDimensions((initialData.dimensions ?? {}) as Record<string, number>);
      setWeight(initialData.weight);
    }
  }, [initialData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const allVariantAttributes = {
        ...variantAttributes,
        ...customAttributes,
      };
      Object.keys(allVariantAttributes).forEach(key => {
        if (
          !allVariantAttributes[key] ||
          allVariantAttributes[key].trim() === ''
        ) {
          delete allVariantAttributes[key];
        }
      });

      const cleanDimensions = { ...dimensions };
      Object.keys(cleanDimensions).forEach(key => {
        if (!cleanDimensions[key] || cleanDimensions[key] === 0) {
          delete cleanDimensions[key];
        }
      });

      const updateData = {
        variant_attributes:
          Object.keys(allVariantAttributes).length > 0
            ? allVariantAttributes
            : null,
        dimensions:
          Object.keys(cleanDimensions).length > 0 ? cleanDimensions : null,
        weight: weight ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (dbError) throw dbError;

      setSuccess(true);
      onUpdate(updateData);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erreur sauvegarde caractéristiques:', err);
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomAttribute = () => {
    if (newAttributeKey.trim() && newAttributeValue.trim()) {
      setCustomAttributes(prev => ({
        ...prev,
        [newAttributeKey.trim()]: newAttributeValue.trim(),
      }));
      setNewAttributeKey('');
      setNewAttributeValue('');
    }
  };

  const handleDimensionChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    setDimensions(prev => ({ ...prev, [key]: isNaN(numValue) ? 0 : numValue }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-black" />
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-black">
                Caractéristiques produit
              </span>
              <span className="text-sm text-gray-600 font-normal">
                {productName}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Caractéristiques mises à jour avec succès !
              </AlertDescription>
            </Alert>
          )}

          <ProductVariantAttributesForm
            variantAttributes={variantAttributes}
            onAttributeChange={(key, value) =>
              setVariantAttributes(prev => ({ ...prev, [key]: value }))
            }
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Dimensions physiques
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DIMENSION_FIELDS.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-medium">
                    {field.label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type="number"
                      step="0.1"
                      min="0"
                      value={dimensions[field.key] ?? ''}
                      onChange={e =>
                        handleDimensionChange(field.key, e.target.value)
                      }
                      placeholder="0"
                      className="text-sm pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {field.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="weight"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Weight className="h-4 w-4 text-gray-600" />
                  Poids
                </Label>
                <div className="relative">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={weight ?? ''}
                    onChange={e =>
                      setWeight(parseFloat(e.target.value) || undefined)
                    }
                    placeholder="0"
                    className="text-sm pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ProductCustomAttributesForm
            customAttributes={customAttributes}
            newAttributeKey={newAttributeKey}
            newAttributeValue={newAttributeValue}
            onNewKeyChange={setNewAttributeKey}
            onNewValueChange={setNewAttributeValue}
            onAddAttribute={handleAddCustomAttribute}
            onRemoveAttribute={key =>
              setCustomAttributes(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
              })
            }
          />
        </div>

        <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(variantAttributes).length +
                Object.keys(customAttributes).length}{' '}
              attribut(s) défini(s)
            </div>
            <div className="flex gap-2">
              <ButtonV2 variant="outline" onClick={onClose} disabled={saving}>
                Annuler
              </ButtonV2>
              <ButtonV2
                onClick={() => {
                  void handleSave().catch(() => undefined);
                }}
                disabled={saving}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {saving ? (
                  <>Sauvegarde...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </ButtonV2>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
