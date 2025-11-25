'use client';

import React, { useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { Button } from '@verone/ui';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { RefreshCw, AlertTriangle, Package, Search } from 'lucide-react';

import { useStock } from '../../hooks';
import { useStockMovements, type StockReasonCode } from '../../hooks';

interface GeneralStockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GeneralStockMovementModal({
  isOpen,
  onClose,
  onSuccess,
}: GeneralStockMovementModalProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [movementType, setMovementType] = useState<'add' | 'remove' | 'adjust'>(
    'add'
  );
  const [quantity, setQuantity] = useState('');
  const [reasonCode, setReasonCode] =
    useState<StockReasonCode>('manual_adjustment');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { toast } = useToast();
  const { createManualMovement } = useStock();
  const { getReasonsByCategory, getReasonDescription } = useStockMovements();

  const currentStock = selectedProduct?.stock_real || 0;
  // min_stock n'est pas dans ProductData, utiliser valeur par défaut
  const minLevel = 5;
  const reasonsByCategory = getReasonsByCategory();

  // Validation en temps réel
  const getValidationMessage = () => {
    if (!selectedProduct)
      return { type: 'error', message: 'Veuillez sélectionner un produit' };
    if (!quantity) return null;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0)
      return { type: 'error', message: 'Quantité invalide' };

    if (movementType === 'remove' && qty > currentStock) {
      return {
        type: 'error',
        message: `Stock insuffisant (disponible: ${currentStock})`,
      };
    }

    if (movementType === 'adjust') {
      const newStock = qty;
      if (newStock < minLevel) {
        return {
          type: 'warning',
          message: `Attention: Stock sous le seuil minimum (${minLevel})`,
        };
      }
    }

    if (movementType === 'remove') {
      const newStock = currentStock - qty;
      if (newStock < minLevel) {
        return {
          type: 'warning',
          message: `Attention: Stock résultant sous le seuil (${newStock})`,
        };
      }
    }

    return null;
  };

  const validation = getValidationMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez sélectionner un produit',
        variant: 'destructive',
      });
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez saisir une quantité valide supérieure à 0',
        variant: 'destructive',
      });
      return;
    }

    if (validation?.type === 'error') {
      toast({
        title: 'Erreur',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createManualMovement({
        product_id: selectedProduct.id,
        movement_type: movementType,
        quantity: parseInt(quantity),
        reason_code: reasonCode,
        notes: notes.trim() || undefined,
        unit_cost: unitCost ? parseFloat(unitCost) : undefined,
      });

      // Réinitialiser le formulaire après succès
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      // Erreur gérée dans le hook
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity('');
    setUnitCost('');
    setNotes('');
    setReasonCode('manual_adjustment');
    setMovementType('add');
    setShowAdvanced(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Suggestions de motifs selon le type de mouvement
  const getSuggestedReasons = () => {
    switch (movementType) {
      case 'add':
        return [
          ...reasonsByCategory.entrees_speciales,
          ...reasonsByCategory.retours_sav,
        ];
      case 'remove':
        return [
          ...reasonsByCategory.pertes_degradations,
          ...reasonsByCategory.usage_commercial,
          ...reasonsByCategory.rd_production,
        ];
      case 'adjust':
        return reasonsByCategory.ajustements;
      default:
        return [];
    }
  };

  const suggestedReasons = getSuggestedReasons();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mouvement de stock - Sélection produit
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du produit */}
          <div className="space-y-3">
            <Label>
              Produit <span className="text-red-500">*</span>
            </Label>

            {/* Bouton pour ouvrir le sélecteur universel */}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-auto min-h-[2.5rem] p-3"
              onClick={() => setShowProductSelector(true)}
            >
              {selectedProduct ? (
                <div className="flex items-center gap-3 text-left">
                  <ProductThumbnail
                    src={selectedProduct.product_images?.[0]?.public_url}
                    alt={selectedProduct.name}
                    size="xs"
                  />
                  <div>
                    <div className="font-medium">{selectedProduct.name}</div>
                    <div className="text-sm text-gray-600">
                      {selectedProduct.sku}
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">
                  Sélectionner un produit...
                </span>
              )}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {/* Modal sélection produit avec filtres */}
            <UniversalProductSelectorV2
              open={showProductSelector}
              onClose={() => setShowProductSelector(false)}
              onSelect={products => {
                if (products.length > 0) {
                  setSelectedProduct(products[0]);
                }
                setShowProductSelector(false);
              }}
              mode="single"
              context="orders"
              title="Sélectionner un produit"
              description="Recherchez par nom, SKU ou filtrez par catégorie/sous-catégorie"
              showImages
              showQuantity={false}
              showPricing={false}
            />
          </div>

          {/* Informations produit sélectionné */}
          {selectedProduct && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span>
                  <strong>SKU:</strong> {selectedProduct.sku}
                </span>
                <span>
                  <strong>Stock actuel:</strong> {currentStock} unités
                </span>
              </div>
              {currentStock <= minLevel && (
                <div className="flex items-center gap-2 mt-2 text-white">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Stock sous le seuil minimum ({minLevel})</span>
                </div>
              )}
            </div>
          )}

          {/* Type de mouvement */}
          <div className="space-y-3">
            <Label>Type d'opération</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={movementType === 'add' ? 'secondary' : 'outline'}
                onClick={() => setMovementType('add')}
                className="justify-start"
              >
                Ajouter (+)
              </Button>
              <Button
                type="button"
                variant={movementType === 'remove' ? 'secondary' : 'outline'}
                onClick={() => setMovementType('remove')}
                className="justify-start"
              >
                Retirer (-)
              </Button>
              <Button
                type="button"
                variant={movementType === 'adjust' ? 'secondary' : 'outline'}
                onClick={() => setMovementType('adjust')}
                className="justify-start"
              >
                Ajuster (=)
              </Button>
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label>
              {movementType === 'adjust'
                ? 'Nouvelle quantité finale'
                : 'Quantité à traiter'}
            </Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder={
                movementType === 'adjust'
                  ? 'Quantité finale souhaitée'
                  : "Nombre d'unités"
              }
              required
            />
            {validation && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  validation.type === 'error' ? 'text-red-600' : 'text-white'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>{validation.message}</span>
              </div>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-3">
            <Label>Motif de l'opération</Label>

            {/* Motifs suggérés */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Motifs courants :</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedReasons.slice(0, 4).map(reason => (
                  <Button
                    key={reason.code}
                    type="button"
                    variant={
                      reasonCode === reason.code ? 'secondary' : 'outline'
                    }
                    size="sm"
                    onClick={() => setReasonCode(reason.code)}
                    className="justify-start text-left h-auto py-2"
                  >
                    <div>
                      <div className="font-medium">{reason.label}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Tous les motifs */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  {showAdvanced ? 'Masquer' : 'Voir tous les motifs'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <Select
                  value={reasonCode}
                  onValueChange={(value: StockReasonCode) =>
                    setReasonCode(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un motif détaillé" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(reasonsByCategory).map(
                      ([category, reasons]) => (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                            {category.replace('_', ' ')}
                          </div>
                          {reasons.map(reason => (
                            <SelectItem key={reason.code} value={reason.code}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </div>
                      )
                    )}
                  </SelectContent>
                </Select>
              </CollapsibleContent>
            </Collapsible>

            {/* Description du motif sélectionné */}
            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
              <strong>Motif sélectionné:</strong>{' '}
              {getReasonDescription(reasonCode)}
            </div>
          </div>

          {/* Notes obligatoires pour certains motifs */}
          <div className="space-y-2">
            <Label>
              Notes explicatives
              {[
                'theft',
                'loss_unknown',
                'damage_transport',
                'write_off',
              ].includes(reasonCode) && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Détails sur l'opération (obligatoire pour certains motifs)..."
              rows={3}
              required={[
                'theft',
                'loss_unknown',
                'damage_transport',
                'write_off',
              ].includes(reasonCode)}
            />
          </div>

          {/* Coût unitaire optionnel */}
          {movementType === 'add' && (
            <div className="space-y-2">
              <Label>Coût unitaire (optionnel)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={e => setUnitCost(e.target.value)}
                placeholder="0.00 €"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                loading || validation?.type === 'error' || !selectedProduct
              }
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enregistrer le mouvement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
