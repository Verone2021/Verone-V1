'use client';

import { useState, useEffect } from 'react';

import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { SourcingProductModal } from '@verone/products/components/sourcing/SourcingProductModal';
import { Alert, AlertDescription } from '@verone/ui';
import { Plus, Sparkles, ShoppingCart, Calculator } from 'lucide-react';

import type { ConsultationItem } from '@verone/consultations/hooks';
import { useConsultationItems } from '@verone/consultations/hooks';

import { ConsultationMarginKpis } from './ConsultationMarginKpis';
import { ConsultationProductsTable } from './ConsultationProductsTable';

interface ConsultationOrderInterfaceProps {
  consultationId: string;
  onItemsChanged?: () => void;
  onCreatePurchaseOrder?: (acceptedItems: ConsultationItem[]) => void;
}

export function ConsultationOrderInterface({
  consultationId,
  onItemsChanged,
  onCreatePurchaseOrder,
}: ConsultationOrderInterfaceProps) {
  const {
    consultationItems,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    getTotalItemsCount,
    fetchConsultationItems,
  } = useConsultationItems(consultationId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSourcingModal, setShowSourcingModal] = useState(false);

  // Édition inline
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editShippingCost, setEditShippingCost] = useState('');
  const [editCostPriceOverride, setEditCostPriceOverride] = useState('');
  const [editIsSample, setEditIsSample] = useState(false);

  // Notif changement items — onItemsChanged volontairement exclu pour éviter boucle infinie
  const itemsCount = consultationItems.length;
  useEffect(() => {
    onItemsChanged?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsCount]);

  const handleProductAdded = () => {
    void fetchConsultationItems(consultationId);
    onItemsChanged?.();
  };

  const startEditItem = (item: ConsultationItem) => {
    setEditingItem(item.id);
    setEditQuantity(item.quantity);
    setEditPrice(item.unit_price?.toString() ?? '');
    setEditNotes(item.notes ?? '');
    setEditShippingCost(item.shipping_cost?.toString() ?? '0');
    setEditCostPriceOverride(item.cost_price_override?.toString() ?? '');
    setEditIsSample(item.is_sample ?? false);
  };

  const saveEditItem = (itemId: string): void => {
    void updateItem(itemId, {
      quantity: editQuantity,
      unit_price: editPrice ? parseFloat(editPrice) : undefined,
      notes: editNotes || undefined,
      shipping_cost: editShippingCost ? parseFloat(editShippingCost) : 0,
      cost_price_override: editCostPriceOverride
        ? parseFloat(editCostPriceOverride)
        : undefined,
      is_sample: editIsSample,
    })
      .then(success => {
        if (success) setEditingItem(null);
      })
      .catch(err => {
        console.error('[ConsultationOrderInterface] saveEditItem failed:', err);
      });
  };

  const cancelEditItem = () => setEditingItem(null);

  const handleRemoveItem = (itemId: string, productName: string): void => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir retirer "${productName}" de la consultation ?`
      )
    ) {
      void removeItem(itemId).catch(err => {
        console.error('[ConsultationOrderInterface] removeItem failed:', err);
      });
    }
  };

  const changeLineStatus = (itemId: string, status: string): void => {
    void updateItem(itemId, { status }).catch(err => {
      console.error(
        '[ConsultationOrderInterface] changeLineStatus failed:',
        err
      );
    });
  };

  const changeQuantity = (itemId: string, delta: number): void => {
    const item = consultationItems.find(i => i.id === itemId);
    if (!item) return;
    void updateItem(itemId, {
      quantity: Math.max(1, item.quantity + delta),
    }).catch(err => {
      console.error('[ConsultationOrderInterface] changeQuantity failed:', err);
    });
  };

  const handleSampleChange = (itemId: string, priceStr: string): void => {
    // Input vide → ligne normale (pas echantillon)
    // Input '0' → echantillon gratuit
    // Input > 0 → echantillon a prix reduit
    const trimmed = priceStr.trim();
    let patch: Partial<{
      is_sample: boolean;
      is_free: boolean;
      unit_price: number;
    }> = {};
    if (trimmed === '') {
      patch = { is_sample: false, is_free: false };
    } else {
      const price = parseFloat(trimmed);
      if (Number.isNaN(price) || price < 0) return;
      patch =
        price === 0
          ? { is_sample: true, is_free: true, unit_price: 0 }
          : { is_sample: true, is_free: false, unit_price: price };
    }
    void updateItem(itemId, patch).catch(err => {
      console.error(
        '[ConsultationOrderInterface] handleSampleChange failed:',
        err
      );
    });
  };

  // Calculs marges
  const getItemCostPrice = (item: ConsultationItem): number =>
    item.cost_price_override ?? item.product?.cost_price ?? 0;

  const getItemCostTotal = (item: ConsultationItem): number => {
    if (item.is_free || item.is_sample)
      return getItemCostPrice(item) * item.quantity;
    return (getItemCostPrice(item) + item.shipping_cost) * item.quantity;
  };

  const getItemMargin = (item: ConsultationItem): number => {
    if (item.is_free || item.is_sample)
      return -(getItemCostPrice(item) * item.quantity);
    const costPerUnit = getItemCostPrice(item) + item.shipping_cost;
    return ((item.unit_price ?? 0) - costPerUnit) * item.quantity;
  };

  const getItemMarginPercent = (item: ConsultationItem): number => {
    const costPerUnit = getItemCostPrice(item) + item.shipping_cost;
    if (costPerUnit === 0 || item.is_free || item.is_sample) return 0;
    return (((item.unit_price ?? 0) - costPerUnit) / costPerUnit) * 100;
  };

  const totalItems = getTotalItemsCount();
  const acceptedItems = consultationItems.filter(
    i => i.status === 'approved' || i.status === 'ordered'
  );
  const hasAcceptedItems = acceptedItems.length > 0;

  // KPIs = uniquement les items acceptes ou commandes (projection reelle)
  const total = acceptedItems.reduce((sum, item) => {
    if (item.is_free) return sum;
    return sum + (item.unit_price ?? 0) * item.quantity;
  }, 0);
  const totalCost = acceptedItems.reduce(
    (sum, item) => sum + getItemCostTotal(item),
    0
  );
  const totalShipping = acceptedItems.reduce(
    (sum, item) =>
      item.is_sample ? sum : sum + item.shipping_cost * item.quantity,
    0
  );
  const totalMargin = acceptedItems.reduce(
    (sum, item) => sum + getItemMargin(item),
    0
  );
  const totalMarginPercent =
    totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white rounded-xl border border-zinc-100">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-900 mr-3" />
        <span className="text-sm text-zinc-500">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {/* KPIs sticky header */}
      {consultationItems.length > 0 && (
        <ConsultationMarginKpis
          total={total}
          totalCost={totalCost}
          totalShipping={totalShipping}
          totalMargin={totalMargin}
          totalMarginPercent={totalMarginPercent}
        />
      )}

      {/* Tableau produits */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-100">
        {/* Header tableau */}
        <div className="px-4 py-2.5 flex justify-between items-center bg-zinc-50/50 border-b border-zinc-100">
          <h3 className="text-xs font-bold text-zinc-700">
            Articles ({totalItems} · {total.toFixed(2)}€ HT)
          </h3>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded h-7"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowSourcingModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 rounded h-7"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Sourcer
            </button>
          </div>
        </div>

        {/* Table dense */}
        <ConsultationProductsTable
          items={consultationItems}
          editingItem={editingItem}
          editQuantity={editQuantity}
          editPrice={editPrice}
          editNotes={editNotes}
          editShippingCost={editShippingCost}
          editCostPriceOverride={editCostPriceOverride}
          editIsSample={editIsSample}
          onSetEditQuantity={setEditQuantity}
          onSetEditPrice={setEditPrice}
          onSetEditNotes={setEditNotes}
          onSetEditShippingCost={setEditShippingCost}
          onSetEditCostPriceOverride={setEditCostPriceOverride}
          onStartEdit={startEditItem}
          onSaveEdit={saveEditItem}
          onCancelEdit={cancelEditItem}
          onChangeQuantity={changeQuantity}
          onChangeStatus={changeLineStatus}
          onSampleChange={handleSampleChange}
          onRemove={handleRemoveItem}
          getItemCostPrice={getItemCostPrice}
          getItemMargin={getItemMargin}
          getItemMarginPercent={getItemMarginPercent}
        />

        {/* Footer stats + CTA Commander */}
        {consultationItems.length > 0 && (
          <div className="px-4 py-2.5 flex justify-between items-center border-t border-zinc-100 bg-zinc-50/30">
            <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500">
              <Calculator className="h-3.5 w-3.5" />
              <span>
                {totalItems} article{totalItems > 1 ? 's' : ''}
              </span>
              <span className="text-emerald-600">
                {acceptedItems.length} accepté
                {acceptedItems.length > 1 ? 's' : ''}
              </span>
              <span className="text-red-500">
                {consultationItems.filter(i => i.status === 'rejected').length}{' '}
                refusé
                {consultationItems.filter(i => i.status === 'rejected').length >
                1
                  ? 's'
                  : ''}
              </span>
              <span className="text-amber-500">
                {consultationItems.filter(i => i.status === 'pending').length}{' '}
                en attente
              </span>
            </div>
            {hasAcceptedItems && onCreatePurchaseOrder && (
              <button
                type="button"
                onClick={() => onCreatePurchaseOrder(acceptedItems)}
                className="px-3 py-1.5 bg-zinc-900 text-white text-[12px] font-bold rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 active:scale-95 transition-all h-8"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Commander ({acceptedItems.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <UniversalProductSelectorV2
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelect={async (products: SelectedProduct[]) => {
          for (const product of products) {
            await addItem({
              consultation_id: consultationId,
              product_id: product.id,
              quantity: product.quantity ?? 1,
              unit_price: product.unit_price ?? undefined,
              is_free: false,
            });
          }
          setShowAddModal(false);
        }}
        mode="multi"
        context="consultations"
        selectedProducts={[]}
        showQuantity
        showImages
      />

      <SourcingProductModal
        open={showSourcingModal}
        onClose={() => setShowSourcingModal(false)}
        consultationId={consultationId}
        onProductCreatedAndAdded={handleProductAdded}
      />
    </div>
  );
}
