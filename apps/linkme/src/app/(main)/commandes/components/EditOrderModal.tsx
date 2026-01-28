'use client';

/**
 * EditOrderModal - Modal d'édition de commande brouillon LinkMe
 *
 * Permet aux utilisateurs enseigne de modifier leurs commandes
 * tant qu'elles sont en statut "brouillon" (draft).
 *
 * BIDIRECTIONNEL: Les modifications sont automatiquement visibles
 * dans le back-office Vérone.
 *
 * Design: Charte LinkMe (turquoise #5DBEBB, navy #183559)
 *
 * @module EditOrderModal
 * @since 2026-01-12
 */

import { useState, useEffect, useMemo } from 'react';

import Image from 'next/image';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label as _Label,
  Separator,
} from '@verone/ui';
import { calculateMargin, LINKME_CONSTANTS } from '@verone/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertCircle,
  CalendarIcon,
  ImageIcon,
  Loader2,
  Minus,
  PackageIcon,
  Plus,
  Save,
  Trash2,
  XIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  LinkMeOrder,
  OrderItem,
} from '../../../../hooks/use-linkme-orders';
import {
  useUpdateDraftOrder,
  type UpdateDraftOrderItemInput,
} from '../../../../lib/hooks/use-update-draft-order';

// ============================================
// TYPES
// ============================================

interface EditOrderModalProps {
  order: LinkMeOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface EditableItem extends OrderItem {
  originalQuantity: number;
  _delete?: boolean;
}

// ============================================
// HELPERS
// ============================================

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// ============================================
// COMPONENT
// ============================================

export function EditOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: EditOrderModalProps) {
  const updateOrder = useUpdateDraftOrder();

  // État des items éditables
  const [items, setItems] = useState<EditableItem[]>([]);
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState<string>('');

  // Charger les données de la commande
  useEffect(() => {
    if (order) {
      setItems(
        (order.items || []).map(item => ({
          ...item,
          originalQuantity: item.quantity,
          _delete: false,
        }))
      );
      setDesiredDeliveryDate(order.desired_delivery_date ?? '');
    }
  }, [order]);

  // Calculer les totaux en temps réel
  const totals = useMemo(() => {
    const roundMoney = (value: number): number => Math.round(value * 100) / 100;

    let productsHt = 0;
    let totalCommission = 0;

    for (const item of items) {
      if (!item._delete) {
        productsHt = roundMoney(
          productsHt + item.quantity * item.unit_price_ht
        );
        // ✅ SSOT: Utiliser calculateMargin pour obtenir le gain correct
        const { gainEuros } = calculateMargin({
          basePriceHt: item.base_price_ht,
          marginRate: item.margin_rate,
        });
        totalCommission = roundMoney(
          totalCommission + gainEuros * item.quantity
        );
      }
    }

    const shippingHt = order?.shipping_cost_ht ?? 0;
    const totalHt = roundMoney(productsHt + shippingHt);
    const totalTtc = roundMoney(totalHt * 1.2); // TVA 20%

    return {
      productsHt,
      shippingHt,
      totalHt,
      totalTtc,
      totalCommission,
    };
  }, [items, order?.shipping_cost_ht]);

  // Vérifier si des modifications ont été faites
  const hasChanges = useMemo(() => {
    if (!order) return false;

    const dateChanged =
      desiredDeliveryDate !== (order.desired_delivery_date ?? '');
    const itemsChanged = items.some(
      item => item.quantity !== item.originalQuantity || item._delete
    );

    return dateChanged || itemsChanged;
  }, [order, desiredDeliveryDate, items]);

  // Modifier la quantité d'un item
  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Marquer un item pour suppression
  const toggleDeleteItem = (itemId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, _delete: !item._delete };
        }
        return item;
      })
    );
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!order || !hasChanges) return;

    // Préparer les items pour l'update
    const itemsInput: UpdateDraftOrderItemInput[] = items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      _delete: item._delete,
    }));

    try {
      const result = await updateOrder.mutateAsync({
        orderId: order.id,
        items: itemsInput,
        desiredDeliveryDate: desiredDeliveryDate || undefined,
      });

      if (result.success) {
        toast.success('Commande mise à jour avec succès');
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error ?? 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de la commande');
    }
  };

  // Vérifier si la commande est éditable
  const isEditable = order?.status === 'draft';

  if (!isOpen || !order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl font-semibold text-[#183559]">
              Modifier la commande
            </DialogTitle>
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 border-amber-200"
            >
              Brouillon
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {!isEditable ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Cette commande ne peut plus être modifiée car elle n&apos;est plus
              en brouillon.
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Info commande */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>N° {order.order_number}</span>
              <span>Client: {order.customer_name}</span>
            </div>

            <Separator />

            {/* Section: Articles */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
                <PackageIcon className="h-4 w-4 text-[#5DBEBB]" />
                Articles ({items.filter(i => !i._delete).length})
              </h3>
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      item._delete
                        ? 'bg-red-50 border-red-200 opacity-60'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Image produit */}
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Infos produit */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm truncate ${
                          item._delete
                            ? 'line-through text-gray-400'
                            : 'text-[#183559]'
                        }`}
                      >
                        {item.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.unit_price_ht)} HT × {item.quantity} ={' '}
                        <span className="font-medium">
                          {formatPrice(item.unit_price_ht * item.quantity)} HT
                        </span>
                      </p>
                    </div>

                    {/* Contrôles quantité */}
                    {!item._delete && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-[#183559]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Indicateur de modification */}
                    {item.quantity !== item.originalQuantity &&
                      !item._delete && (
                        <span className="text-xs text-[#5DBEBB] font-medium">
                          (était {item.originalQuantity})
                        </span>
                      )}

                    {/* Bouton supprimer */}
                    <button
                      type="button"
                      onClick={() => toggleDeleteItem(item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item._delete
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          : 'text-red-500 hover:bg-red-100'
                      }`}
                      title={
                        item._delete ? 'Annuler la suppression' : 'Supprimer'
                      }
                    >
                      {item._delete ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Section: Date de livraison */}
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
                <CalendarIcon className="h-4 w-4 text-[#5DBEBB]" />
                Date de livraison souhaitée
              </h3>
              <Input
                type="date"
                value={
                  desiredDeliveryDate ? desiredDeliveryDate.split('T')[0] : ''
                }
                onChange={e => setDesiredDeliveryDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="max-w-xs"
              />
              {order.desired_delivery_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Actuellement:{' '}
                  {format(
                    new Date(order.desired_delivery_date),
                    'dd MMMM yyyy',
                    {
                      locale: fr,
                    }
                  )}
                </p>
              )}
            </section>

            <Separator />

            {/* Section: Totaux */}
            <section>
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total produits HT</span>
                  <span className="font-medium text-[#183559]">
                    {formatPrice(totals.productsHt)}
                  </span>
                </div>
                {totals.shippingHt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais de livraison HT</span>
                    <span className="text-[#183559]">
                      {formatPrice(totals.shippingHt)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total HT</span>
                  <span className="font-semibold text-[#183559]">
                    {formatPrice(totals.totalHt)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA (20%)</span>
                  <span className="text-[#183559]">
                    {formatPrice(totals.totalTtc - totals.totalHt)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold text-[#183559]">
                    Total TTC
                  </span>
                  <span className="text-lg font-bold text-[#183559]">
                    {formatPrice(totals.totalTtc)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200 bg-emerald-50 -mx-4 px-4 py-2 rounded-b-lg">
                  <span className="text-emerald-700 font-medium">
                    Votre commission TTC
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    +
                    {formatPrice(
                      totals.totalCommission *
                        (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* Avertissement modifications non enregistrées */}
            {hasChanges && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-700">
                  Vous avez des modifications non enregistrées
                </span>
              </div>
            )}

            {/* Erreur */}
            {updateOrder.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {updateOrder.error instanceof Error
                    ? updateOrder.error.message
                    : 'Erreur lors de la mise à jour'}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleSave().catch(error => {
                console.error('[EditOrderModal] Save failed:', error);
              });
            }}
            disabled={!hasChanges || updateOrder.isPending || !isEditable}
            className="bg-[#5DBEBB] hover:bg-[#4DAEAB] text-white"
          >
            {updateOrder.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditOrderModal;
