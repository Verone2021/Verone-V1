'use client';

import { useState, useEffect } from 'react';
import { Euro, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ButtonV2 } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Props pour GoogleMerchantPriceEditor
 */
export interface GoogleMerchantPriceEditorProps {
  /** Produit à éditer */
  product: {
    id: string;
    name: string;
    sku: string;
    cost_price?: number; // Prix HT de base
    custom_price_ht?: number | null; // Prix custom HT (si défini)
  };
  /** Callback lors de la sauvegarde */
  onSave: (productId: string, newPriceHT: number) => void;
  /** Callback lors de l'annulation */
  onCancel: () => void;
  /** État d'ouverture du modal */
  open: boolean;
}

/**
 * Composant: GoogleMerchantPriceEditor
 *
 * Modal pour éditer le prix HT custom d'un produit Google Merchant.
 * Features:
 * - Affichage prix actuel (HT + TTC)
 * - Badge source ("Prix base" gris / "Prix custom" bleu)
 * - Input nouveau prix HT avec validation
 * - Preview TTC dynamique (HT × 1.20)
 * - Différence affichée (± XX€)
 * - Validation min/max (0.01 - 999999.99)
 *
 * Design System V2:
 * - Primary color: #3b86d1 (badges, focus)
 * - Success: #38ce3c (positive difference)
 * - Warning: #ff9b3e (negative difference)
 * - Rounded corners, subtle shadows
 *
 * @example
 * <GoogleMerchantPriceEditor
 *   product={product}
 *   onSave={(id, price) => updateCustomPrice(id, price)}
 *   onCancel={() => setEditing(false)}
 *   open={isEditing}
 * />
 */
export function GoogleMerchantPriceEditor({
  product,
  onSave,
  onCancel,
  open,
}: GoogleMerchantPriceEditorProps) {
  const TVA_RATE = 1.2; // 20% TVA

  // Prix actuel (custom si défini, sinon base)
  const currentPriceHT = product.custom_price_ht ?? product.cost_price ?? 0;
  const currentPriceTTC = currentPriceHT * TVA_RATE;
  const hasCustomPrice =
    product.custom_price_ht !== null && product.custom_price_ht !== undefined;

  // State pour nouveau prix
  const [newPriceHT, setNewPriceHT] = useState<string>(
    currentPriceHT.toFixed(2)
  );
  const [error, setError] = useState<string | null>(null);

  // Reset state quand modal s'ouvre
  useEffect(() => {
    if (open) {
      setNewPriceHT(currentPriceHT.toFixed(2));
      setError(null);
    }
  }, [open, currentPriceHT]);

  // Calcul preview TTC
  const parsedPriceHT = parseFloat(newPriceHT) || 0;
  const previewPriceTTC = parsedPriceHT * TVA_RATE;

  // Calcul différence
  const difference = parsedPriceHT - currentPriceHT;
  const differencePercent =
    currentPriceHT > 0 ? ((difference / currentPriceHT) * 100).toFixed(1) : '0';

  // Validation
  const validate = (): boolean => {
    const price = parseFloat(newPriceHT);

    if (isNaN(price)) {
      setError('Prix invalide');
      return false;
    }

    if (price < 0.01) {
      setError('Prix minimum: 0,01 €');
      return false;
    }

    if (price > 999999.99) {
      setError('Prix maximum: 999 999,99 €');
      return false;
    }

    setError(null);
    return true;
  };

  // Handler sauvegarde
  const handleSave = () => {
    if (validate()) {
      onSave(product.id, parseFloat(newPriceHT));
    }
  };

  // Handler input change
  const handleInputChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    setNewPriceHT(sanitized);

    // Clear error on input
    if (error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-black">
            Modifier le prix Google Merchant
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {product.name}
            <span className="block text-sm text-gray-500 font-mono mt-1">
              SKU: {product.sku}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Prix actuel */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Prix actuel
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'border-2',
                  hasCustomPrice
                    ? 'border-[#3b86d1] text-[#3b86d1] bg-blue-50'
                    : 'border-gray-300 text-gray-600 bg-gray-100'
                )}
              >
                {hasCustomPrice ? 'Prix custom' : 'Prix base'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">HT</p>
                <p className="text-2xl font-bold text-black">
                  {currentPriceHT.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">TTC</p>
                <p className="text-2xl font-bold text-gray-700">
                  {currentPriceTTC.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          {/* Input nouveau prix */}
          <div className="space-y-2">
            <Label
              htmlFor="new-price"
              className="text-sm font-medium text-gray-700"
            >
              Nouveau prix HT
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="new-price"
                type="text"
                inputMode="decimal"
                value={newPriceHT}
                onChange={e => handleInputChange(e.target.value)}
                className={cn(
                  'pl-10 text-lg font-semibold border-2',
                  error
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-[#3b86d1] focus:border-[#3b86d1]'
                )}
                placeholder="0.00"
                aria-label="Nouveau prix HT"
                aria-invalid={!!error}
                aria-describedby={error ? 'price-error' : undefined}
              />
            </div>

            {error && (
              <div
                id="price-error"
                className="flex items-center gap-2 text-sm text-red-600"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Preview TTC */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-[#3b86d1]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Preview TTC (TVA 20%)
              </span>
            </div>
            <p className="text-3xl font-bold text-[#3b86d1]">
              {previewPriceTTC.toFixed(2)} €
            </p>

            {/* Différence */}
            {Math.abs(difference) > 0.01 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium',
                    difference > 0 ? 'text-[#38ce3c]' : 'text-[#ff9b3e]'
                  )}
                >
                  {difference > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {difference > 0 ? '+' : ''}
                    {difference.toFixed(2)} € ({differencePercent}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <ButtonV2
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            type="button"
            onClick={handleSave}
            disabled={!!error || Math.abs(difference) < 0.01}
            className="bg-[#3b86d1] hover:bg-[#2a75c0] text-white"
          >
            Mettre à jour
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
