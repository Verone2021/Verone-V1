'use client';

import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Plus } from 'lucide-react';

import type { PurchaseOrderFormModalProps } from './types';
import { usePurchaseOrderForm } from './hooks';
import { AdditionalCostsCard } from './components/AdditionalCostsCard';
import { GeneralInfoCard } from './components/GeneralInfoCard';
import { OrderItemsCard } from './components/OrderItemsCard';
import { OrderSummaryCard } from './components/OrderSummaryCard';

export function PurchaseOrderFormModal(props: PurchaseOrderFormModalProps) {
  const { order, isOpen } = props;

  const {
    open,
    loading,
    selectedSupplierId,
    selectedSupplier,
    expectedDeliveryDate,
    setExpectedDeliveryDate,
    deliveryAddress,
    setDeliveryAddress,
    notes,
    setNotes,
    ecoTaxVatRate,
    setEcoTaxVatRate,
    paymentTerms,
    shippingCostHt,
    setShippingCostHt,
    customsCostHt,
    setCustomsCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    showProductSelector,
    setShowProductSelector,
    isEditMode,
    isBlocked,
    displayItems,
    itemsLoading,
    totalHT,
    totalCharges,
    totalTTC,
    excludeProductIds,
    handleSupplierChange,
    handleSupplierCreated,
    handleProductsSelect,
    handleUpdateItem,
    handleRemoveItem,
    handleClose,
    handleSubmit,
    handleOpenChange,
    setOpen,
  } = usePurchaseOrderForm(props);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={
          typeof isOpen !== 'undefined' ? handleOpenChange : setOpen
        }
      >
        {typeof isOpen === 'undefined' && !isEditMode && (
          <DialogTrigger asChild>
            <ButtonV2 className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </ButtonV2>
          </DialogTrigger>
        )}
        <DialogContent className="h-screen md:h-auto max-w-full md:max-w-6xl md:max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? `Modifier Commande ${order?.po_number ?? ''}`
                : 'Nouvelle Commande Fournisseur'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Modifier les informations et les produits de la commande'
                : "Créer une nouvelle commande d'approvisionnement"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Alerte blocage édition */}
            {isBlocked && order && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  Edition bloquée : Cette commande est{' '}
                  {order.status === 'received' ? 'reçue' : 'annulée'}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Les modifications ne sont pas autorisées pour ce statut.
                </p>
              </div>
            )}

            <form
              onSubmit={e => {
                void handleSubmit(e);
              }}
              className="space-y-6"
            >
              <GeneralInfoCard
                isEditMode={isEditMode}
                isBlocked={isBlocked}
                loading={loading}
                selectedSupplierId={selectedSupplierId}
                selectedSupplier={selectedSupplier}
                expectedDeliveryDate={expectedDeliveryDate}
                deliveryAddress={deliveryAddress}
                notes={notes}
                ecoTaxVatRate={ecoTaxVatRate}
                paymentTerms={paymentTerms}
                onSupplierChange={id => {
                  void handleSupplierChange(id);
                }}
                onSupplierCreated={(...args) => {
                  void handleSupplierCreated(...args);
                }}
                onExpectedDeliveryDateChange={setExpectedDeliveryDate}
                onDeliveryAddressChange={setDeliveryAddress}
                onNotesChange={setNotes}
                onEcoTaxVatRateChange={setEcoTaxVatRate}
              />

              <AdditionalCostsCard
                isBlocked={isBlocked}
                shippingCostHt={shippingCostHt}
                customsCostHt={customsCostHt}
                insuranceCostHt={insuranceCostHt}
                onShippingCostChange={setShippingCostHt}
                onCustomsCostChange={setCustomsCostHt}
                onInsuranceCostChange={setInsuranceCostHt}
              />

              <OrderItemsCard
                isEditMode={isEditMode}
                isBlocked={isBlocked}
                selectedSupplierId={selectedSupplierId}
                displayItems={displayItems}
                itemsLoading={itemsLoading}
                onAddProducts={() => setShowProductSelector(true)}
                onUpdateItem={(id, data) => {
                  void handleUpdateItem(id, data);
                }}
                onRemoveItem={id => {
                  void handleRemoveItem(id);
                }}
              />

              {displayItems.length > 0 && (
                <OrderSummaryCard
                  totalHT={totalHT}
                  totalCharges={totalCharges}
                  totalTTC={totalTTC}
                />
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                <ButtonV2
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="w-full md:w-auto"
                >
                  {isEditMode ? 'Fermer' : 'Annuler'}
                </ButtonV2>
                {!isBlocked && (
                  <ButtonV2
                    type="submit"
                    disabled={loading || !selectedSupplierId}
                    className="w-full md:w-auto"
                  >
                    {loading
                      ? 'Enregistrement...'
                      : isEditMode
                        ? 'Enregistrer'
                        : 'Créer la commande'}
                  </ButtonV2>
                )}
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal UniversalProductSelectorV2 - disponible en création ET édition */}
      {showProductSelector && (
        <UniversalProductSelectorV2
          open={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onSelect={(products: SelectedProduct[]) => {
            void handleProductsSelect(products);
          }}
          mode="multi"
          context="orders"
          title="Sélectionner des produits pour la commande"
          description="Choisissez les produits à ajouter. Vous pourrez ajuster quantités et prix après sélection."
          excludeProductIds={excludeProductIds}
          supplierId={selectedSupplierId || null}
          showImages
          showQuantity
          showPricing
        />
      )}
    </>
  );
}
