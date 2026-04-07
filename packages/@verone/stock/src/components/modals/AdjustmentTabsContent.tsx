'use client';

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { TabsContent } from '@verone/ui';
import { Textarea } from '@verone/ui';

import type { StockReasonCode } from '../../hooks';
import type { AdjustmentFormData } from './inventory-adjustment.types';

interface AdjustmentTabsContentProps {
  formData: AdjustmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdjustmentFormData>>;
  product: { stock_quantity: number } | null;
  calculateQuantityChange: () => number;
  calculateNewStock: () => number;
  getReasonOptions: () => { code: StockReasonCode; label: string }[];
}

export function AdjustmentTabsContent({
  formData,
  setFormData,
  product,
  calculateQuantityChange,
  calculateNewStock,
  getReasonOptions,
}: AdjustmentTabsContentProps) {
  const set = (patch: Partial<AdjustmentFormData>) =>
    setFormData(prev => ({ ...prev, ...patch }));

  return (
    <div className="mt-6 space-y-4">
      {/* TAB: Increase */}
      <TabsContent value="increase" className="space-y-4 m-0">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-900">
            ✅ Augmentez le stock suite à une trouvaille inventaire, retour
            client ou réception manuelle
          </p>
        </div>
        <div>
          <Label htmlFor="quantity-increase">Quantité à ajouter *</Label>
          <Input
            id="quantity-increase"
            type="number"
            min="1"
            step="1"
            value={formData.quantity}
            onChange={e => set({ quantity: e.target.value })}
            placeholder="Ex: 10"
            required
            className="mt-1"
          />
          {product && formData.quantity && (
            <p className="text-xs text-gray-500 mt-1">
              Stock actuel: {product.stock_quantity} → Nouveau:{' '}
              {calculateNewStock()}
              <span className="text-green-600 font-medium ml-2">
                (+{calculateQuantityChange()})
              </span>
            </p>
          )}
        </div>
      </TabsContent>

      {/* TAB: Decrease */}
      <TabsContent value="decrease" className="space-y-4 m-0">
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-900">
            ⚠️ Diminuez le stock suite à une casse, perte, vol ou mise au rebut
          </p>
        </div>
        <div>
          <Label htmlFor="quantity-decrease">Quantité à retirer *</Label>
          <Input
            id="quantity-decrease"
            type="number"
            min="1"
            max={product?.stock_quantity ?? 0}
            step="1"
            value={formData.quantity}
            onChange={e => set({ quantity: e.target.value })}
            placeholder="Ex: 5"
            required
            className="mt-1"
          />
          {product && formData.quantity && (
            <p className="text-xs text-gray-500 mt-1">
              Stock actuel: {product.stock_quantity} → Nouveau:{' '}
              {calculateNewStock()}
              <span className="text-red-600 font-medium ml-2">
                ({calculateQuantityChange()})
              </span>
            </p>
          )}
          {product && (
            <p className="text-xs text-gray-500 mt-1">
              Maximum disponible : {product.stock_quantity} unités
            </p>
          )}
        </div>
      </TabsContent>

      {/* TAB: Correction */}
      <TabsContent value="correction" className="space-y-4 m-0">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            ℹ️ Correction suite à inventaire physique : définissez la nouvelle
            quantité totale réelle
          </p>
        </div>
        <div>
          <Label htmlFor="quantity-correction">
            Nouvelle quantité totale *
          </Label>
          <Input
            id="quantity-correction"
            type="number"
            min="0"
            step="1"
            value={formData.quantity}
            onChange={e => set({ quantity: e.target.value })}
            placeholder="Ex: 15"
            required
            className="mt-1"
          />
          {product && formData.quantity && (
            <p className="text-xs text-gray-500 mt-1">
              Stock actuel: {product.stock_quantity} → Nouvelle quantité:{' '}
              {formData.quantity}
              <span
                className={`ml-2 font-medium ${calculateQuantityChange() > 0 ? 'text-green-600' : calculateQuantityChange() < 0 ? 'text-red-600' : 'text-gray-600'}`}
              >
                ({calculateQuantityChange() > 0 ? '+' : ''}
                {calculateQuantityChange()})
              </span>
            </p>
          )}
        </div>
      </TabsContent>

      {/* Motif - Commun à tous */}
      <div>
        <Label htmlFor="reason">Motif *</Label>
        <Select
          value={formData.reasonCode}
          onValueChange={value => set({ reasonCode: value as StockReasonCode })}
        >
          <SelectTrigger id="reason" className="mt-1">
            <SelectValue placeholder="Sélectionner un motif" />
          </SelectTrigger>
          <SelectContent>
            {getReasonOptions().map(reason => (
              <SelectItem key={reason.code} value={reason.code}>
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes - Commun à tous */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={e => set({ notes: e.target.value })}
          placeholder="Détails sur l'ajustement (optionnel)..."
          rows={3}
          className="mt-1"
        />
      </div>
    </div>
  );
}
