'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import {
  cn,
  calculateMargin,
  calculateMarginRateFromPrices,
} from '@verone/utils';
import {
  X,
  Edit,
  Package,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  Save,
  Lock,
} from 'lucide-react';

import {
  useLinkMeOrder,
  useUpdateLinkMeOrder,
  type UpdateLinkMeOrderInput,
  type LinkMeOrderItem,
} from '../hooks/use-linkme-orders';

interface EditLinkMeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

interface EditableItem extends LinkMeOrderItem {
  originalQuantity: number;
  originalUnitPriceHt: number;
  editableMarginRate: number;
}

/**
 * Modal d'edition de commande LinkMe
 * Permet de modifier: TVA, frais, notes, quantites, prix et marges (si draft)
 */
export function EditLinkMeOrderModal({
  isOpen,
  onClose,
  orderId,
}: EditLinkMeOrderModalProps) {
  const { data: order, isLoading } = useLinkMeOrder(orderId);
  const updateOrder = useUpdateLinkMeOrder();

  // Champs editables
  const [taxRate, setTaxRate] = useState<number>(0.2);
  const [shippingCostHt, setShippingCostHt] = useState<number>(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(0);
  const [handlingCostHt, setHandlingCostHt] = useState<number>(0);
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [items, setItems] = useState<EditableItem[]>([]);

  // Editable uniquement en draft
  const isEditable = order?.status === 'draft';

  // Charger les donnees de la commande
  useEffect(() => {
    if (order) {
      setTaxRate(order.tax_rate ?? 0.2);
      setShippingCostHt(order.shipping_cost_ht ?? 0);
      setInsuranceCostHt(order.insurance_cost_ht ?? 0);
      setHandlingCostHt(order.handling_cost_ht ?? 0);
      setInternalNotes(order.notes ?? '');
      setItems(
        (order.items ?? []).map(item => ({
          ...item,
          originalQuantity: item.quantity,
          originalUnitPriceHt: item.unit_price_ht,
          editableMarginRate: calculateMarginRateFromPrices(
            item.base_price_ht,
            item.unit_price_ht
          ),
        }))
      );
    }
  }, [order]);

  // Calculer les totaux
  const totals = useMemo(() => {
    const roundMoney = (value: number): number => Math.round(value * 100) / 100;

    let productsHt = 0;
    let totalCommission = 0;
    for (const item of items) {
      productsHt = roundMoney(productsHt + item.quantity * item.unit_price_ht);
      // Commission = (unit_price - base_price) x qty
      const commission =
        (item.unit_price_ht - item.base_price_ht) * item.quantity;
      totalCommission = roundMoney(totalCommission + commission);
    }

    const feesHt = roundMoney(
      shippingCostHt + insuranceCostHt + handlingCostHt
    );
    const totalHt = roundMoney(productsHt + feesHt);
    const totalTtc = roundMoney(totalHt * (1 + taxRate));

    return { productsHt, feesHt, totalHt, totalTtc, totalCommission };
  }, [items, taxRate, shippingCostHt, insuranceCostHt, handlingCostHt]);

  // Modifier quantite
  const updateQuantity = (itemId: string, delta: number) => {
    setItems(
      items.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Modifier prix de vente HT → recalcule la marge
  const updateItemPrice = useCallback((itemId: string, newPrice: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const safePrice = Math.max(0, newPrice);
        const newMarginRate =
          safePrice > item.base_price_ht
            ? calculateMarginRateFromPrices(item.base_price_ht, safePrice)
            : 0;
        return {
          ...item,
          unit_price_ht: safePrice,
          editableMarginRate: newMarginRate,
        };
      })
    );
  }, []);

  // Modifier marge → recalcule le prix de vente
  const updateItemMarginRate = useCallback(
    (itemId: string, newRate: number) => {
      setItems(prev =>
        prev.map(item => {
          if (item.id !== itemId) return item;
          const safeRate = Math.max(0, Math.min(99.9, newRate));
          const { sellingPriceHt } = calculateMargin({
            basePriceHt: item.base_price_ht,
            marginRate: safeRate,
          });
          return {
            ...item,
            unit_price_ht: sellingPriceHt,
            editableMarginRate: safeRate,
          };
        })
      );
    },
    []
  );

  // Verifier si modifie
  const hasChanges = useMemo(() => {
    if (!order) return false;

    const taxChanged = taxRate !== (order.tax_rate ?? 0.2);
    const shippingChanged = shippingCostHt !== (order.shipping_cost_ht ?? 0);
    const insuranceChanged = insuranceCostHt !== (order.insurance_cost_ht ?? 0);
    const handlingChanged = handlingCostHt !== (order.handling_cost_ht ?? 0);
    const notesChanged = internalNotes !== (order.notes ?? '');
    const itemsChanged = items.some(
      item =>
        item.quantity !== item.originalQuantity ||
        item.unit_price_ht !== item.originalUnitPriceHt
    );

    return (
      taxChanged ||
      shippingChanged ||
      insuranceChanged ||
      handlingChanged ||
      notesChanged ||
      itemsChanged
    );
  }, [
    order,
    taxRate,
    shippingCostHt,
    insuranceCostHt,
    handlingCostHt,
    internalNotes,
    items,
  ]);

  // Sauvegarder
  const handleSave = async () => {
    if (!orderId || !hasChanges) return;

    const input: UpdateLinkMeOrderInput = {
      id: orderId,
      tax_rate: taxRate,
      shipping_cost_ht: shippingCostHt,
      insurance_cost_ht: insuranceCostHt,
      handling_cost_ht: handlingCostHt,
      internal_notes: internalNotes,
      items: items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        // Envoyer retrocession_rate si le prix a change
        ...(item.unit_price_ht !== item.originalUnitPriceHt
          ? { retrocession_rate: item.editableMarginRate / 100 }
          : {}),
      })),
    };

    try {
      await updateOrder.mutateAsync(input);
      onClose();
    } catch (error) {
      console.error('Erreur mise a jour commande:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Modifier la commande</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {order?.order_number ?? 'Chargement...'}
                  </p>
                  {order?.status && (
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        order.status === 'draft'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {order.status === 'draft' ? 'Brouillon' : order.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !order ? (
              <div className="text-center py-8 text-gray-500">
                Commande non trouvee
              </div>
            ) : (
              <>
                {/* Info lecture seule si pas draft */}
                {!isEditable && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <Lock className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Les prix sont verrouilles (commande{' '}
                      {order.status === 'validated' ? 'validee' : order.status}
                      ). Seuls les frais et notes sont modifiables.
                    </p>
                  </div>
                )}

                {/* Taux de TVA */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Taux de TVA
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 0.2, label: '20%', desc: 'Standard' },
                      { value: 0.1, label: '10%', desc: 'Intermediaire' },
                      { value: 0.055, label: '5,5%', desc: 'Reduit' },
                      { value: 0, label: '0%', desc: 'Exonere' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTaxRate(opt.value)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all text-center',
                          taxRate === opt.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="block text-lg font-semibold">
                          {opt.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frais additionnels */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Frais additionnels
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Livraison */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Livraison HT
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shippingCostHt ?? ''}
                          onChange={e =>
                            setShippingCostHt(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                          placeholder="0.00"
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          EUR
                        </span>
                      </div>
                    </div>

                    {/* Manutention */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Manutention HT
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={handlingCostHt ?? ''}
                          onChange={e =>
                            setHandlingCostHt(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                          placeholder="0.00"
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          EUR
                        </span>
                      </div>
                    </div>

                    {/* Assurance */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Assurance HT
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={insuranceCostHt ?? ''}
                          onChange={e =>
                            setInsuranceCostHt(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                          placeholder="0.00"
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          EUR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lignes de commande */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 inline mr-1" />
                    Produits ({items.length})
                  </label>
                  <div className="space-y-2 max-h-[340px] overflow-y-auto">
                    {items.map(item => {
                      const priceChanged =
                        item.unit_price_ht !== item.originalUnitPriceHt;
                      const qtyChanged =
                        item.quantity !== item.originalQuantity;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'p-3 rounded-lg border',
                            priceChanged
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                          )}
                        >
                          {/* Ligne 1: Nom + Quantite */}
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-gray-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {item.product_name}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 hover:bg-gray-200 rounded"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            {qtyChanged && (
                              <span className="text-xs text-blue-600">
                                (etait {item.originalQuantity})
                              </span>
                            )}
                          </div>

                          {/* Ligne 2: Prix / Marge (editable si draft) */}
                          <div className="mt-2 grid grid-cols-4 gap-2 items-end">
                            {/* Prix base HT (lecture seule) */}
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">
                                Prix base HT
                              </label>
                              <div className="px-2 py-1.5 bg-gray-100 rounded text-xs text-gray-500 tabular-nums">
                                {item.base_price_ht.toFixed(2)} EUR
                              </div>
                            </div>

                            {/* Prix vente HT (editable si draft) */}
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">
                                Prix vente HT
                              </label>
                              {isEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price_ht}
                                  onChange={e =>
                                    updateItemPrice(
                                      item.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="px-2 py-1.5 bg-gray-100 rounded text-xs text-gray-500 tabular-nums flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  {item.unit_price_ht.toFixed(2)} EUR
                                </div>
                              )}
                            </div>

                            {/* Marge % (editable si draft) */}
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">
                                Marge %
                              </label>
                              {isEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max="99.9"
                                  step="0.1"
                                  value={item.editableMarginRate}
                                  onChange={e =>
                                    updateItemMarginRate(
                                      item.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="px-2 py-1.5 bg-gray-100 rounded text-xs text-gray-500 tabular-nums flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  {item.editableMarginRate.toFixed(1)}%
                                </div>
                              )}
                            </div>

                            {/* Total ligne */}
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">
                                Total HT
                              </label>
                              <div className="px-2 py-1.5 bg-gray-100 rounded text-xs font-medium tabular-nums">
                                {(item.unit_price_ht * item.quantity).toFixed(
                                  2
                                )}{' '}
                                EUR
                              </div>
                            </div>
                          </div>

                          {/* Indicateur de modification prix */}
                          {priceChanged && (
                            <p className="mt-1 text-[10px] text-blue-600">
                              Prix modifie (etait{' '}
                              {item.originalUnitPriceHt.toFixed(2)} EUR)
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes internes
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Notes visibles uniquement par l'equipe..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Totaux */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sous-total produits HT</span>
                    <span>{totals.productsHt.toFixed(2)} EUR</span>
                  </div>
                  {totals.feesHt > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Frais</span>
                      <span>{totals.feesHt.toFixed(2)} EUR</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total HT</span>
                    <span className="font-medium">
                      {totals.totalHt.toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      TVA ({(taxRate * 100).toFixed(taxRate === 0.055 ? 1 : 0)}
                      %)
                    </span>
                    <span>
                      {(totals.totalTtc - totals.totalHt).toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t">
                    <span>Total TTC</span>
                    <span>{totals.totalTtc.toFixed(2)} EUR</span>
                  </div>
                  {/* Commission affilie */}
                  {totals.totalCommission > 0 && (
                    <div className="flex justify-between text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                      <span>Commission affilie totale</span>
                      <span className="font-medium">
                        {totals.totalCommission.toFixed(2)} EUR
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Erreur */}
            {updateOrder.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {updateOrder.error instanceof Error
                    ? updateOrder.error.message
                    : 'Erreur lors de la mise a jour'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex-1">
              {hasChanges && (
                <span className="text-xs text-amber-600">
                  Modifications non enregistrees
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                void handleSave().catch(error => {
                  console.error(
                    '[EditLinkMeOrderModal] handleSave failed:',
                    error
                  );
                });
              }}
              disabled={!hasChanges || updateOrder.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateOrder.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
