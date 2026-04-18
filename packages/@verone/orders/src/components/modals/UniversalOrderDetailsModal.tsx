'use client';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { X, Loader2, ShoppingCart, TruckIcon, Edit, Save } from 'lucide-react';

import { AddProductToOrderModal } from '@verone/orders/components/modals/AddProductToOrderModal';
import { OrderHeaderEditSection } from '@verone/orders/components/sections/OrderHeaderEditSection';

import { UniversalOrderHeaderCard } from './UniversalOrderHeaderCard';
import { UniversalOrderItemsCard } from './UniversalOrderItemsCard';
import type { UniversalOrderDetailsModalProps } from './universal-order-modal.types';
import { useUniversalOrderModal } from './use-universal-order-modal';

export function UniversalOrderDetailsModal({
  orderId,
  orderType,
  open,
  onClose,
  initialEditMode = false,
  onUpdate,
  renderActions,
}: UniversalOrderDetailsModalProps) {
  const {
    isEditMode,
    showAddProductModal,
    setShowAddProductModal,
    orderHeader,
    items,
    isLoading,
    hasError,
    inlineEdit,
    toggleMode,
    handleSaveHeader,
    handleHeaderChange,
    handleAddProduct,
    handleUpdateItem,
    handleRemoveItem,
  } = useUniversalOrderModal({
    orderId,
    orderType,
    open,
    initialEditMode,
    onUpdate,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="h-screen md:h-auto max-w-full md:max-w-5xl md:max-h-[95vh] flex flex-col overflow-hidden"
        hideCloseButton
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {orderType === 'sales' ? (
                <>
                  <ShoppingCart className="h-6 w-6" /> Commande Client
                </>
              ) : (
                <>
                  <TruckIcon className="h-6 w-6" /> Commande Fournisseur
                </>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {orderHeader?.status === 'draft' && !isEditMode && (
                <ButtonV2 variant="outline" size="sm" onClick={toggleMode}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </ButtonV2>
              )}
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          )}

          {hasError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Erreur</p>
              <p className="text-red-600 text-sm mt-1">{hasError}</p>
            </div>
          )}

          {!isLoading && !hasError && orderHeader && (
            <div className="space-y-6">
              {isEditMode ? (
                <OrderHeaderEditSection
                  orderType={orderType ?? 'purchase'}
                  data={
                    inlineEdit.getEditedData('order_header') ?? {
                      billing_address: orderHeader.billing_address,
                      shipping_address: orderHeader.shipping_address,
                      delivery_address: orderHeader.delivery_address,
                      expected_delivery_date:
                        orderHeader.expected_delivery_date,
                      payment_terms: orderHeader.payment_terms,
                      tax_rate: orderHeader.tax_rate,
                      eco_tax_vat_rate: orderHeader.eco_tax_vat_rate,
                    }
                  }
                  customerName={orderHeader.customer_name}
                  supplierName={orderHeader.supplier_name}
                  onChange={handleHeaderChange}
                  readonly={false}
                />
              ) : (
                <UniversalOrderHeaderCard orderHeader={orderHeader} />
              )}

              <UniversalOrderItemsCard
                items={items}
                orderType={orderType ?? 'purchase'}
                isEditMode={isEditMode}
                isDraft={orderHeader?.status === 'draft'}
                onAddProduct={() => setShowAddProductModal(true)}
                onUpdateItem={(id, data) => {
                  void handleUpdateItem(id, data);
                }}
                onRemoveItem={id => {
                  void handleRemoveItem(id);
                }}
              />
            </div>
          )}

          {renderActions &&
            orderHeader &&
            orderType === 'sales' &&
            renderActions({
              id: orderHeader.id,
              order_number: orderHeader.order_number,
              status: orderHeader.status,
              total_ht: orderHeader.total_ht ?? 0,
              total_ttc: orderHeader.total_ttc,
              tax_rate: orderHeader.tax_rate ?? 20,
              currency: orderHeader.currency ?? 'EUR',
              payment_terms: orderHeader.payment_terms ?? 'immediate',
              payment_status: orderHeader.payment_status_v2 ?? 'pending',
              customer_name:
                orderHeader.customer_trade_name ??
                orderHeader.customer_name ??
                'Client',
              customer_email: orderHeader.customer_email ?? null,
              customer_type: orderHeader.customer_type ?? 'organization',
              shipping_cost_ht: orderHeader.shipping_cost_ht ?? 0,
              handling_cost_ht: orderHeader.handling_cost_ht ?? 0,
              insurance_cost_ht: orderHeader.insurance_cost_ht ?? 0,
              fees_vat_rate: orderHeader.fees_vat_rate ?? 0.2,
              items,
            })}
        </div>

        <AddProductToOrderModal
          open={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          orderType={orderType ?? 'purchase'}
          onAdd={data => {
            void handleAddProduct(data);
          }}
        />

        {isEditMode && orderHeader && (
          <DialogFooter className="flex-col gap-2 md:flex-row border-t pt-4">
            <ButtonV2
              variant="outline"
              onClick={toggleMode}
              disabled={inlineEdit.isSaving('order_header')}
              className="w-full md:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={() => {
                void handleSaveHeader();
              }}
              disabled={
                !inlineEdit.hasChanges('order_header') ||
                inlineEdit.isSaving('order_header')
              }
              className="w-full md:w-auto"
            >
              {inlineEdit.isSaving('order_header') ? (
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
            </ButtonV2>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
