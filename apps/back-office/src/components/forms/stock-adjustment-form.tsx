/**
 * Formulaire: StockAdjustmentForm
 * Route: /stocks/ajustements/create (inline dans page)
 * Description: Formulaire ajustement inventaire (augmentation/diminution/correction)
 * Table Supabase: stock_movements (movement_type = 'ADJUST')
 * Bucket Storage: stock-adjustments
 */

'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
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
import { createClient } from '@verone/utils/supabase/client';
import { format } from 'date-fns';
import { Loader2, Save, AlertCircle } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface Product {
  id: string;
  sku: string;
  name: string;
  stock_quantity: number;
}

interface StockAdjustmentFormData {
  product_id: string;
  adjustment_type: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason:
    | 'inventory_count'
    | 'damage'
    | 'loss'
    | 'found'
    | 'correction'
    | 'other';
  notes: string;
  adjustment_date: string;
  reference_document?: string;
  uploaded_file_url?: string;
}

interface StockAdjustmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

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
// COMPOSANT PRINCIPAL
// =====================================================================

export function StockAdjustmentForm({
  onSuccess,
  onCancel,
}: StockAdjustmentFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // États formulaire
  const [formData, setFormData] = useState<StockAdjustmentFormData>({
    product_id: '',
    adjustment_type: 'correction',
    quantity: 0,
    reason: 'inventory_count',
    notes: '',
    adjustment_date: format(new Date(), 'yyyy-MM-dd'),
    reference_document: '',
    uploaded_file_url: '',
  });

  // États UI
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger liste produits
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, sku, name, stock_quantity')
          .order('name');

        if (error) throw error;

        setProducts((data as any) || []);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
        setError('Impossible de charger la liste des produits');
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  // Mise à jour produit sélectionné
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData({ ...formData, product_id: productId });
  };

  // Calculer quantity_change selon type ajustement
  const calculateQuantityChange = (): number => {
    const qty = Math.abs(formData.quantity);

    switch (formData.adjustment_type) {
      case 'increase':
        return qty; // Positif
      case 'decrease':
        return -qty; // Négatif
      case 'correction':
        // Correction = différence entre stock actuel et quantité cible
        if (!selectedProduct) return 0;
        return formData.quantity - selectedProduct.stock_quantity;
      default:
        return 0;
    }
  };

  // Validation formulaire
  const validateForm = (): boolean => {
    if (!formData.product_id) {
      setError('Veuillez sélectionner un produit');
      return false;
    }

    if (formData.quantity === 0) {
      setError('La quantité doit être différente de 0');
      return false;
    }

    if (formData.adjustment_type !== 'correction' && formData.quantity < 0) {
      setError('La quantité doit être positive');
      return false;
    }

    if (formData.reason === 'other' && formData.notes.trim().length < 10) {
      setError('Veuillez détailler la raison (minimum 10 caractères)');
      return false;
    }

    // Vérifier stock suffisant pour diminution
    if (
      formData.adjustment_type === 'decrease' &&
      selectedProduct &&
      formData.quantity > selectedProduct.stock_quantity
    ) {
      setError(
        `Stock insuffisant (stock actuel: ${selectedProduct.stock_quantity})`
      );
      return false;
    }

    return true;
  };

  // Soumission formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const quantityChange = calculateQuantityChange();
      const quantityBefore = selectedProduct?.stock_quantity || 0;
      const quantityAfter = quantityBefore + quantityChange;

      // Récupérer user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Insérer stock_movement
      // ✅ FIX Phase 3.6: Définir explicitement affects_forecast et forecast_type
      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: formData.product_id,
          movement_type: 'ADJUST',
          quantity_change: quantityChange,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          affects_forecast: false, // ✅ EXPLICITE: Ajustements manuels = mouvements réels
          forecast_type: null, // ✅ EXPLICITE: Pas de direction prévisionnel pour ajustements
          reference_type: 'manual_adjustment',
          reference_id: crypto.randomUUID(), // UUID unique pour traçabilité
          notes: `${formData.reason}: ${formData.notes}`,
          performed_by: user.id,
          performed_at: new Date(formData.adjustment_date).toISOString(),
        });

      if (insertError) throw insertError;

      // Succès
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/stocks/ajustements');
        router.refresh();
      }
    } catch (err) {
      console.error('Erreur création ajustement:', err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'ajustement"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handler upload fichier
  const handleFileUpload = (url: string, fileName: string) => {
    setFormData({
      ...formData,
      uploaded_file_url: url,
      reference_document: fileName,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations Ajustement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Produit */}
          <div className="space-y-2">
            <Label htmlFor="product">
              Produit <span className="text-red-500">*</span>
            </Label>
            {loadingProducts ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">
                  Chargement produits...
                </span>
              </div>
            ) : (
              <Select
                value={formData.product_id}
                onValueChange={handleProductChange}
                disabled={loading}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.sku} - {product.name} (Stock:{' '}
                      {product.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedProduct && (
              <p className="text-sm text-gray-500">
                Stock actuel: <strong>{selectedProduct.stock_quantity}</strong>{' '}
                unités
              </p>
            )}
          </div>

          {/* Type ajustement */}
          <div className="space-y-2">
            <Label htmlFor="adjustment_type">
              Type d'ajustement <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.adjustment_type}
              onValueChange={value =>
                setFormData({
                  ...formData,
                  adjustment_type: value as any,
                })
              }
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

          {/* Quantité */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {formData.adjustment_type === 'correction'
                ? 'Nouvelle quantité cible'
                : 'Quantité à ajuster'}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={formData.quantity}
              onChange={e =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              disabled={loading}
              required
            />
            {formData.adjustment_type === 'correction' && selectedProduct && (
              <p className="text-sm text-gray-500">
                Différence:{' '}
                <strong>
                  {calculateQuantityChange() > 0 ? '+' : ''}
                  {calculateQuantityChange()}
                </strong>{' '}
                unités
              </p>
            )}
          </div>

          {/* Raison */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Raison <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.reason}
              onValueChange={value =>
                setFormData({ ...formData, reason: value as any })
              }
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

          {/* Date ajustement */}
          <div className="space-y-2">
            <Label htmlFor="adjustment_date">
              Date ajustement <span className="text-red-500">*</span>
            </Label>
            <Input
              id="adjustment_date"
              type="date"
              value={formData.adjustment_date}
              onChange={e =>
                setFormData({ ...formData, adjustment_date: e.target.value })
              }
              disabled={loading}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes{' '}
              {formData.reason === 'other' && (
                <span className="text-red-500">* (minimum 10 caractères)</span>
              )}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Détails sur l'ajustement..."
              rows={3}
              disabled={loading}
              required={formData.reason === 'other'}
            />
          </div>

          {/* Upload fichier justificatif */}
          <ImageUploadZone
            bucket="stock-adjustments"
            folder={`adjustments/${new Date().getFullYear()}/${String(
              new Date().getMonth() + 1
            ).padStart(2, '0')}`}
            onUploadSuccess={handleFileUpload}
            label="Document justificatif (optionnel)"
            helperText="Ajoutez une photo ou PDF justifiant l'ajustement"
            acceptedFormats={{
              'image/*': ['.png', '.jpg', '.jpeg'],
              'application/pdf': ['.pdf'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                ['.xlsx'],
            }}
          />
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-md bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ButtonV2 type="submit" disabled={loading || loadingProducts}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Créer l'ajustement
            </>
          )}
        </ButtonV2>

        {onCancel && (
          <ButtonV2 type="button" variant="outline" onClick={onCancel}>
            Annuler
          </ButtonV2>
        )}
      </div>
    </form>
  );
}
