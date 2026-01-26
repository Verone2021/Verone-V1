'use client';

/**
 * CartStep - Étape 4 du formulaire de commande
 *
 * Affiche le panier modifiable avec :
 * - Liste des produits ajoutés
 * - Modification des quantités
 * - Suppression d'articles
 * - Récapitulatif (Total HT, TVA, TTC, Commission)
 *
 * @module CartStep
 * @since 2026-01-20
 */

import Image from 'next/image';

import { Card, cn } from '@verone/ui';
import {
  ShoppingCart,
  Package,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  Calculator,
  Coins,
  User,
  ArrowDownCircle,
} from 'lucide-react';

import { useAffiliateCommissionTotal } from '../../../lib/hooks/use-affiliate-commission';
import type { OrderFormData } from '../schemas/order-form.schema';

// ============================================================================
// TYPES
// ============================================================================

interface CartStepProps {
  formData: OrderFormData;
  errors: string[];
  cartTotals: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    totalCommission: number;
    itemsCount: number;
    effectiveTaxRate: number;
  };
  onRemove: (selectionItemId: string) => void;
  onUpdateQuantity: (selectionItemId: string, quantity: number) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartStep({
  formData,
  errors,
  cartTotals,
  onRemove,
  onUpdateQuantity,
}: CartStepProps) {
  const items = formData.cart.items;

  // Calculer la commission prélevée sur les produits affiliés
  const affiliateCommission = useAffiliateCommissionTotal(items);

  // Panier vide
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Votre panier est vide
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Retournez à l&apos;étape précédente pour ajouter des produits à votre
          commande.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Liste des produits */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-linkme-turquoise" />
          Produits ({items.length})
        </h3>

        <div className="space-y-3">
          {items.map(item => {
            const lineTotal = item.unitPriceHt * item.quantity;
            const lineTotalTTC = lineTotal * (1 + cartTotals.effectiveTaxRate);

            return (
              <Card key={item.selectionItemId} className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Détails */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 line-clamp-1">
                          {item.productName}
                        </h4>
                        {item.productSku && (
                          <p className="text-xs text-gray-400">
                            Réf: {item.productSku}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">
                            {formatCurrency(item.unitPriceHt)} € HT / unité
                          </span>
                          {/* Badge: "Votre produit" pour affilié, marge pour catalogue */}
                          {item.isAffiliateProduct ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Votre produit
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'text-xs px-1.5 py-0.5 rounded',
                                item.marginRate >= 30
                                  ? 'bg-green-100 text-green-700'
                                  : item.marginRate >= 20
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                              )}
                            >
                              Marge {item.marginRate}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bouton supprimer */}
                      <button
                        type="button"
                        onClick={() => onRemove(item.selectionItemId)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Quantité et total */}
                    <div className="flex items-center justify-between mt-3">
                      {/* Contrôle quantité */}
                      <div className="flex items-center border rounded-lg">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              item.selectionItemId,
                              item.quantity - 1
                            )
                          }
                          disabled={item.quantity <= 1}
                          className={cn(
                            'px-3 py-1.5 transition-colors',
                            item.quantity <= 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-500 hover:bg-gray-100'
                          )}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 1;
                            onUpdateQuantity(
                              item.selectionItemId,
                              Math.max(1, val)
                            );
                          }}
                          className="w-14 text-center border-x py-1.5 text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              item.selectionItemId,
                              item.quantity + 1
                            )
                          }
                          className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Totaux ligne */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(lineTotal)} € HT
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(lineTotalTTC)} € TTC
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="lg:col-span-1">
        <Card className="p-5 sticky top-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-linkme-turquoise" />
            Récapitulatif
          </h3>

          <div className="space-y-3">
            {/* Total HT */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total HT</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(cartTotals.totalHT)} €
              </span>
            </div>

            {/* TVA dynamique selon le pays */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {cartTotals.effectiveTaxRate === 0
                  ? 'TVA (0%) - Export'
                  : `TVA (${Math.round(cartTotals.effectiveTaxRate * 100)}%)`}
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(cartTotals.totalTVA)} €
              </span>
            </div>

            <div className="border-t pt-3">
              {/* Total TTC */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total TTC</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(cartTotals.totalTTC)} €
                </span>
              </div>
            </div>

            {/* Commission gagnée (uniquement si produits catalogue avec marge > 0) */}
            {cartTotals.totalCommission > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Votre commission estimée
                  </span>
                </div>
                <p className="text-lg font-bold text-green-700">
                  +{formatCurrency(cartTotals.totalCommission)} € HT
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Calculée sur la marge de chaque produit catalogue
                </p>
              </div>
            )}

            {/* Commission prélevée (si produits affiliés) */}
            {affiliateCommission.hasAffiliateProducts && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Commission prélevée (
                    {affiliateCommission.affiliateItemsCount} produit
                    {affiliateCommission.affiliateItemsCount > 1
                      ? 's'
                      : ''}{' '}
                    affilié
                    {affiliateCommission.affiliateItemsCount > 1 ? 's' : ''})
                  </span>
                </div>
                <p className="text-lg font-bold text-blue-700">
                  -{formatCurrency(affiliateCommission.totalCommission)} € HT
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Montant déduit de vos produits pour frais de plateforme
                </p>
              </div>
            )}

            {/* Note */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600">
                  Le montant final peut varier selon les options de livraison et
                  promotions applicables.
                </p>
              </div>
            </div>
          </div>

          {/* Nombre d'articles */}
          <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
            {cartTotals.itemsCount} article
            {cartTotals.itemsCount > 1 ? 's' : ''} dans le panier
          </div>
        </Card>
      </div>
    </div>
  );
}

export default CartStep;
