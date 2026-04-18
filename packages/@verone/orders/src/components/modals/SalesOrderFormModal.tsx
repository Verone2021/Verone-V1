'use client';

import { useStockMovements } from '@verone/stock/hooks';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Plus, ArrowLeft } from 'lucide-react';

import { ChannelSelector } from './sales-order-form/ChannelSelector';
import { useLinkMeCart } from './sales-order-form/hooks/use-linkme-cart';
import { useSalesOrderCustomer } from './sales-order-form/hooks/use-sales-order-customer';
import { useSalesOrderForm } from './sales-order-form/hooks/use-sales-order-form';
import { useSalesOrderPricing } from './sales-order-form/hooks/use-sales-order-pricing';
import { useSalesOrderSubmit } from './sales-order-form/hooks/use-sales-order-submit';
import { useSalesOrderTotals } from './sales-order-form/hooks/use-sales-order-totals';
import { LinkMeWorkflow } from './sales-order-form/LinkMeWorkflow';
import { OrderConfirmationDialog } from './sales-order-form/OrderConfirmationDialog';
import type { OrderItem } from './sales-order-form/OrderItemsTable';
import { StandardOrderForm } from './sales-order-form/StandardOrderForm';

interface SalesOrderFormModalProps {
  mode?: 'create' | 'edit';
  orderId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  buttonLabel?: string;
  /** Callback quand l'utilisateur clique "LinkMe" dans le wizard canal (ex: redirection) */
  onLinkMeClick?: () => void;
}

export function SalesOrderFormModal({
  mode = 'create',
  orderId,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
  buttonLabel = 'Nouvelle commande',
  onLinkMeClick,
}: SalesOrderFormModalProps) {
  // Central state hook
  const formState = useSalesOrderForm({ controlledOpen, onOpenChange });

  const {
    open,
    setOpen,
    wizardStep,
    setWizardStep,
    selectedSalesChannel,
    setSelectedSalesChannel,
    loading,
    setLoading,
    loadingOrder,
    selectedCustomer,
    setSelectedCustomer,
    orderDate,
    setOrderDate,
    expectedDeliveryDate,
    setExpectedDeliveryDate,
    shippingAddress,
    setShippingAddress,
    billingAddress,
    setBillingAddress,
    notes,
    setNotes,
    ecoTaxVatRate,
    setEcoTaxVatRate,
    paymentTermsType,
    setPaymentTermsType,
    paymentTermsNotes,
    setPaymentTermsNotes,
    channelId,
    setChannelId,
    availableChannels,
    shippingCostHt,
    setShippingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    handlingCostHt,
    setHandlingCostHt,
    items,
    setItems,
    showProductSelector,
    setShowProductSelector,
    stockWarnings,
    setStockWarnings,
    showConfirmation,
    setShowConfirmation,
    resetForm,
    supabase,
  } = formState;

  // Customer address + payment terms logic
  const { handleCustomerChange } = useSalesOrderCustomer({
    setSelectedCustomer,
    setPaymentTermsType,
    setPaymentTermsNotes,
    setChannelId,
    setShippingAddress,
    setBillingAddress,
  });

  // Pricing, stock checks, item CRUD
  const {
    checkAllStockAvailability,
    handleProductsSelect,
    updateItem,
    removeItem,
  } = useSalesOrderPricing({
    selectedCustomer,
    channelId,
    items,
    setItems,
    setStockWarnings,
    setShowProductSelector,
    supabase,
  });

  const { getAvailableStock } = useStockMovements();

  // Order submit + edit mode loader
  const { handleSubmitConfirmed, handleSubmit } = useSalesOrderSubmit({
    mode,
    orderId,
    open,
    setLoading,
    setLoadingOrder: formState.setLoadingOrder,
    setSelectedCustomer,
    setOrderDate,
    setExpectedDeliveryDate,
    setShippingAddress,
    setBillingAddress,
    setNotes,
    setEcoTaxVatRate,
    setPaymentTermsType,
    setPaymentTermsNotes,
    setChannelId,
    setShippingCostHt,
    setInsuranceCostHt,
    setHandlingCostHt,
    setItems,
    setShowConfirmation,
    selectedCustomer,
    orderDate,
    expectedDeliveryDate,
    shippingAddress,
    billingAddress,
    paymentTermsType,
    paymentTermsNotes,
    channelId,
    notes,
    ecoTaxVatRate,
    shippingCostHt,
    insuranceCostHt,
    handlingCostHt,
    items,
    resetForm,
    setOpen,
    onSuccess,
    checkAllStockAvailability,
    getAvailableStock,
    supabase,
  });

  // LinkMe cart + submit
  const linkme = useLinkMeCart({
    selectedCustomer,
    orderDate,
    notes,
    setLoading,
    resetForm,
    setOpen,
    onSuccess,
  });

  // Totals + channel handlers
  const {
    totalHTProducts,
    totalCharges,
    totalTVA,
    totalTTC,
    excludeProductIds,
    handleChannelSelect,
    handleBackToChannelSelection,
  } = useSalesOrderTotals({
    items,
    shippingCostHt,
    insuranceCostHt,
    handlingCostHt,
    ecoTaxVatRate,
    availableChannels,
    setChannelId,
    setSelectedSalesChannel,
    setWizardStep,
  });

  const isPriceEditable = selectedSalesChannel === 'manual';

  // Sync wrapper: async updateItem called from synchronous child prop
  const handleUpdateItem = (
    itemId: string,
    field: keyof OrderItem,
    value: OrderItem[keyof OrderItem]
  ) => {
    void updateItem(itemId, field, value).catch(console.error);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger visible uniquement en mode non-contrôlé (pas de prop open) */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <ButtonV2 className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {buttonLabel}
          </ButtonV2>
        </DialogTrigger>
      )}
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-6xl md:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? 'Back-office - Modifier la commande client'
              : wizardStep === 'channel-selection'
                ? 'Back-office - Nouvelle commande client'
                : `Back-office - Commande ${selectedSalesChannel === 'manual' ? 'Manuelle' : selectedSalesChannel === 'site-internet' ? 'Site Internet' : 'LinkMe'}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Modifier la commande existante (items, quantités, adresses, dates)'
              : wizardStep === 'channel-selection'
                ? 'Sélectionnez le type de commande à créer'
                : selectedSalesChannel === 'manual'
                  ? 'Créer une commande manuelle avec prix libres'
                  : selectedSalesChannel === 'site-internet'
                    ? 'Créer une commande Site Internet (prix catalogue)'
                    : 'Créer une commande LinkMe (prix sélection)'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: Channel selection (create mode only) */}
          {mode === 'create' && wizardStep === 'channel-selection' && (
            <ChannelSelector
              onChannelSelect={handleChannelSelect}
              onLinkMeClick={onLinkMeClick}
              onClose={() => setOpen(false)}
            />
          )}

          {/* STEP 2: Form (shown if mode=edit OR channel selected) */}
          {(mode === 'edit' || wizardStep === 'form') && (
            <>
              {loadingOrder && (
                <div className="flex justify-center py-8">
                  <div className="text-gray-500">
                    Chargement de la commande...
                  </div>
                </div>
              )}

              {mode === 'create' && (
                <div className="mb-4">
                  <ButtonV2
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBackToChannelSelection(setWizardStep)}
                    className="text-gray-600"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Changer le type de commande
                  </ButtonV2>
                </div>
              )}

              {/* LINKME WORKFLOW */}
              {selectedSalesChannel === 'linkme' && mode === 'create' && (
                <LinkMeWorkflow
                  affiliateType={linkme.linkmeAffiliateType}
                  onAffiliateTypeChange={linkme.setLinkmeAffiliateType}
                  affiliateId={linkme.linkmeAffiliateId}
                  onAffiliateIdChange={linkme.setLinkmeAffiliateId}
                  affiliates={linkme.linkmeAffiliates}
                  loadingAffiliates={linkme.loadingAffiliates}
                  selectionId={linkme.linkmeSelectionId}
                  onSelectionIdChange={linkme.setLinkmeSelectionId}
                  selections={linkme.linkmeSelections}
                  loadingSelections={linkme.loadingSelections}
                  selectionDetail={linkme.linkmeSelectionDetail}
                  loadingSelectionDetail={linkme.loadingSelectionDetail}
                  cart={linkme.linkmeCart}
                  cartTotals={linkme.linkmeCartTotals}
                  onAddProduct={linkme.addLinkMeProduct}
                  onUpdateQuantity={linkme.updateLinkMeQuantity}
                  onRemoveItem={linkme.removeLinkMeItem}
                  onClearCart={() => linkme.setLinkmeCart([])}
                  notes={notes}
                  onNotesChange={setNotes}
                  loading={loading}
                  canSubmit={
                    !loading &&
                    !!selectedCustomer &&
                    linkme.linkmeCart.length > 0 &&
                    !!linkme.linkmeSelectionDetail?.affiliate_id
                  }
                  onSubmit={() => {
                    void linkme.handleLinkMeSubmit().catch(console.error);
                  }}
                  onCancel={() => setOpen(false)}
                  previewSelection={linkme.previewSelection}
                  previewLoading={linkme.previewLoading}
                />
              )}

              {/* STANDARD FORM (Manual + Site Internet + edit mode) */}
              {(selectedSalesChannel !== 'linkme' || mode === 'edit') && (
                <StandardOrderForm
                  mode={mode}
                  loading={loading}
                  loadingOrder={loadingOrder}
                  selectedCustomer={selectedCustomer}
                  onCustomerChange={handleCustomerChange}
                  orderDate={orderDate}
                  onOrderDateChange={setOrderDate}
                  expectedDeliveryDate={expectedDeliveryDate}
                  onExpectedDeliveryDateChange={setExpectedDeliveryDate}
                  paymentTermsType={paymentTermsType}
                  onPaymentTermsTypeChange={setPaymentTermsType}
                  paymentTermsNotes={paymentTermsNotes}
                  onPaymentTermsNotesChange={setPaymentTermsNotes}
                  shippingAddress={shippingAddress}
                  onShippingAddressChange={setShippingAddress}
                  billingAddress={billingAddress}
                  onBillingAddressChange={setBillingAddress}
                  notes={notes}
                  onNotesChange={setNotes}
                  ecoTaxVatRate={ecoTaxVatRate}
                  onEcoTaxVatRateChange={setEcoTaxVatRate}
                  shippingCostHt={shippingCostHt}
                  onShippingCostHtChange={setShippingCostHt}
                  insuranceCostHt={insuranceCostHt}
                  onInsuranceCostHtChange={setInsuranceCostHt}
                  handlingCostHt={handlingCostHt}
                  onHandlingCostHtChange={setHandlingCostHt}
                  items={items}
                  isPriceEditable={isPriceEditable}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={removeItem}
                  showProductSelector={showProductSelector}
                  onShowProductSelectorChange={setShowProductSelector}
                  onProductsSelect={handleProductsSelect}
                  excludeProductIds={excludeProductIds}
                  totalHTProducts={totalHTProducts}
                  totalCharges={totalCharges}
                  totalTVA={totalTVA}
                  totalTTC={totalTTC}
                  stockWarnings={stockWarnings}
                  onSubmit={handleSubmit}
                  onCancel={() => setOpen(false)}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>

      <OrderConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={() => {
          void handleSubmitConfirmed().catch(console.error);
        }}
        loading={loading}
        mode={mode}
        customerName={selectedCustomer?.name}
        itemCount={items.length}
        totalTTC={totalTTC}
        stockWarnings={stockWarnings}
      />
    </Dialog>
  );
}
