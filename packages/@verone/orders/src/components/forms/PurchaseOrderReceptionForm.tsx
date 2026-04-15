'use client';

/**
 * Formulaire Réception Purchase Order
 * Workflow Odoo-inspired avec validation inline
 */

import { useState, useEffect, useMemo } from 'react';

import type { ReceptionItem } from '@verone/types';
import {
  Badge,
  ButtonV2,
  Card,
  Input,
  Label,
  SuccessDialog,
  Textarea,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Package, XCircle } from 'lucide-react';

import {
  usePurchaseReceptions,
  type PurchaseOrderForReception,
} from '@verone/orders/hooks';

import { CancelRemainderModal } from '../modals';
import { ReceptionHistorySection } from './ReceptionHistorySection';
import { ReceptionItemsTable } from './ReceptionItemsTable';

interface IReceptionResultSummary {
  isComplete: boolean;
  poNumber: string;
  items: Array<{
    product_name: string;
    product_sku: string;
    quantity_received: number;
  }>;
  totalValue: number;
}

interface IPurchaseOrderReceptionFormProps {
  purchaseOrder: PurchaseOrderForReception;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PurchaseOrderReceptionForm({
  purchaseOrder,
  onSuccess,
  onCancel,
}: IPurchaseOrderReceptionFormProps): React.ReactNode {
  const supabase = createClient();
  const {
    prepareReceptionItems,
    validateReception,
    validating,
    loadReceptionHistory,
    loadCancellationHistory,
  } = usePurchaseReceptions();

  const [items, setItems] = useState<ReceptionItem[]>([]);
  const [receivedAt, setReceivedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<
    Array<{
      received_at: string;
      total_quantity: number;
      items?: Array<{
        product_sku: string;
        product_name: string;
        quantity_received: number;
      }>;
    }>
  >([]);
  const [cancellations, setCancellations] = useState<
    Array<{
      id: string;
      performed_at: string;
      notes: string | null;
      quantity_cancelled: number;
      product_name: string;
      product_sku: string;
    }>
  >([]);
  const [showCancelRemainderModal, setShowCancelRemainderModal] =
    useState(false);
  const [receptionResult, setReceptionResult] =
    useState<IReceptionResultSummary | null>(null);

  useEffect(() => {
    const receptionItems = prepareReceptionItems(purchaseOrder);
    setItems(receptionItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder]);

  useEffect(() => {
    void loadReceptionHistory(purchaseOrder.id).then(setHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder.id]);

  useEffect(() => {
    void loadCancellationHistory(purchaseOrder.id).then(setCancellations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrder.id]);

  const totals = useMemo(() => {
    const totalQuantityToReceive = items.reduce(
      (sum, item) => sum + (item.quantity_to_receive || 0),
      0
    );
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity_to_receive * item.unit_price_ht,
      0
    );
    const allFullyReceived = items.every(
      item =>
        item.quantity_already_received + item.quantity_to_receive >=
        item.quantity_ordered
    );
    return { totalQuantityToReceive, totalValue, allFullyReceived };
  }, [items]);

  const remainderItems = useMemo(() => {
    return items
      .filter(item => item.quantity_remaining > 0)
      .map(item => ({
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity_remaining: item.quantity_remaining,
      }));
  }, [items]);

  const totalRemainder = useMemo(
    () =>
      remainderItems.reduce((sum, item) => sum + item.quantity_remaining, 0),
    [remainderItems]
  );

  const canCancelRemainder = useMemo(() => {
    const hasRemainder = totalRemainder > 0;
    const isPartiallyReceived = purchaseOrder.status === 'partially_received';
    const isValidated = purchaseOrder.status === 'validated';
    return hasRemainder && (isPartiallyReceived || isValidated);
  }, [totalRemainder, purchaseOrder.status]);

  const hasNoReceptionYet = useMemo(
    () => items.every(item => item.quantity_already_received === 0),
    [items]
  );

  const handleQuantityChange = (itemId: string, value: string): void => {
    const numValue = parseInt(value) || 0;
    setItems(prev =>
      prev.map(item =>
        item.purchase_order_item_id === itemId
          ? {
              ...item,
              quantity_to_receive: Math.max(
                0,
                Math.min(numValue, item.quantity_remaining)
              ),
            }
          : item
      )
    );
  };

  const handleReceiveAll = (): void => {
    setItems(prev =>
      prev.map(item => ({
        ...item,
        quantity_to_receive: item.quantity_remaining,
      }))
    );
  };

  const handleValidate = async (): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      alert('Erreur: utilisateur non authentifié');
      return;
    }

    const itemsToReceive = items
      .filter(item => item.quantity_to_receive > 0)
      .map(item => ({
        purchase_order_item_id: item.purchase_order_item_id,
        product_id: item.product_id,
        quantity_to_receive: item.quantity_to_receive,
      }));

    if (itemsToReceive.length === 0) {
      alert('Veuillez saisir au moins une quantité à recevoir');
      return;
    }

    const result = await validateReception({
      purchase_order_id: purchaseOrder.id,
      items: itemsToReceive,
      received_at: new Date(
        `${receivedAt}T${new Date().toTimeString().split(' ')[0]}`
      ).toISOString(),
      notes: notes || undefined,
      received_by: user.id,
    });

    if (result.success) {
      const receivedItems = items
        .filter(item => item.quantity_to_receive > 0)
        .map(item => ({
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity_received: item.quantity_to_receive,
        }));
      setReceptionResult({
        isComplete: totals.allFullyReceived,
        poNumber: purchaseOrder.po_number,
        items: receivedItems,
        totalValue: totals.totalValue,
      });
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-verone-primary" />
            Réception Marchandise
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Commande {purchaseOrder.po_number} •{' '}
            {purchaseOrder.organisations?.trade_name ??
              purchaseOrder.organisations?.legal_name}
          </p>
        </div>
        <ButtonV2 variant="outline" onClick={handleReceiveAll}>
          Tout recevoir
        </ButtonV2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="text-sm font-medium text-gray-600">À recevoir</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {totals.totalQuantityToReceive}
          </div>
          <div className="text-xs text-gray-500 mt-1">unités</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-sm font-medium text-gray-600">Valeur</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {formatCurrency(totals.totalValue)}
          </div>
          <div className="text-xs text-gray-500 mt-1">HT</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="text-sm font-medium text-gray-600">
            Statut réception
          </div>
          <Badge
            className={`mt-2 ${totals.allFullyReceived ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}
          >
            {totals.allFullyReceived ? '✓ Complète' : '⏳ Partielle'}
          </Badge>
        </Card>
      </div>

      <ReceptionItemsTable
        items={items}
        onQuantityChange={handleQuantityChange}
      />

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date réception</Label>
          <Input
            type="date"
            value={receivedAt}
            onChange={e => setReceivedAt(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Notes réception (optionnel)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      <ReceptionHistorySection
        history={history}
        cancellations={cancellations}
        items={items}
        purchaseOrderStatus={purchaseOrder.status}
      />

      {/* Actions */}
      <div className="flex justify-between gap-3">
        <div>
          {canCancelRemainder && (
            <ButtonV2
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
              onClick={() => setShowCancelRemainderModal(true)}
              disabled={validating}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {hasNoReceptionYet
                ? `Annuler commande (${totalRemainder} unités)`
                : `Annuler reliquat (${totalRemainder} unités)`}
            </ButtonV2>
          )}
        </div>
        <div className="flex gap-3">
          <ButtonV2 variant="outline" onClick={onCancel} disabled={validating}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={() => {
              void handleValidate();
            }}
            disabled={validating || totals.totalQuantityToReceive === 0}
            className="bg-verone-success hover:bg-verone-success/90"
          >
            {validating
              ? 'Validation...'
              : totals.allFullyReceived
                ? 'Valider Réception Complète'
                : 'Valider Réception Partielle'}
          </ButtonV2>
        </div>
      </div>

      <CancelRemainderModal
        open={showCancelRemainderModal}
        onClose={() => setShowCancelRemainderModal(false)}
        purchaseOrderId={purchaseOrder.id}
        poNumber={purchaseOrder.po_number}
        remainderItems={remainderItems}
        onSuccess={onSuccess}
      />

      <SuccessDialog
        open={receptionResult !== null}
        onOpenChange={open => {
          if (!open) {
            setReceptionResult(null);
            onSuccess();
          }
        }}
        title={
          receptionResult?.isComplete
            ? 'Réception complète validée'
            : 'Réception partielle validée'
        }
        description={`La réception de la commande ${receptionResult?.poNumber ?? ''} a été enregistrée.`}
      >
        {receptionResult && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Produits reçus
              </div>
              <div className="space-y-1.5">
                {receptionResult.items.map(item => (
                  <div
                    key={item.product_sku}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {item.product_name}
                      </span>
                      <span className="text-gray-400 ml-1.5 text-xs">
                        {item.product_sku}
                      </span>
                    </div>
                    <span className="font-semibold text-green-700">
                      ×{item.quantity_received}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-emerald-50 p-3">
              <span className="text-sm font-medium text-emerald-700">
                Valeur totale HT
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency(receptionResult.totalValue)}
              </span>
            </div>
          </div>
        )}
      </SuccessDialog>
    </div>
  );
}
