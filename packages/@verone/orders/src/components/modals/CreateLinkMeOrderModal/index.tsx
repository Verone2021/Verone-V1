'use client';

import { AlertCircle, Check, Loader2, ShoppingCart, X } from 'lucide-react';

import { formatCurrency } from '@verone/utils';

import { ContactsAddressesSection } from '../../linkme-contacts';
import { OrderSummaryPanel } from '../OrderSummaryPanel';
import { AdditionalCostsSection } from './AdditionalCostsSection';
import { AffiliateListSection } from './AffiliateListSection';
import { AffiliateTypeSection } from './AffiliateTypeSection';
import { CartSection } from './CartSection';
import { CustomerSection } from './CustomerSection';
import { CustomerSummaryCard } from './CustomerSummaryCard';
import { DeliveryOptionsSection } from './DeliveryOptionsSection';
import { OrderDateNotesSection } from './OrderDateNotesSection';
import { ProductSelectionSection } from './ProductSelectionSection';
import { SelectionListSection } from './SelectionListSection';
import { SelectionPreviewDialog } from './SelectionPreviewDialog';
import type { CreateLinkMeOrderModalProps } from './types';
import { useCreateLinkMeOrderForm } from './use-create-linkme-order-form';

export function CreateLinkMeOrderModal({
  isOpen,
  onClose,
  preselectedAffiliateId,
}: CreateLinkMeOrderModalProps) {
  const form = useCreateLinkMeOrderForm(
    isOpen,
    onClose,
    preselectedAffiliateId
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Back-office - Canal de vente LinkMe - Nouvelle commande
            </h2>
            <p className="text-sm text-gray-500">
              Créer une commande depuis une sélection affilié
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content - Layout 2 colonnes */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* COLONNE GAUCHE - Formulaire */}
          <div className="space-y-6">
            {/* Row 1: Type affilié + Affilié */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AffiliateTypeSection
                affiliateType={form.affiliateType}
                onSelect={form.setAffiliateType}
              />
              {form.affiliateType && (
                <AffiliateListSection
                  affiliates={form.affiliates}
                  affiliatesLoading={form.affiliatesLoading}
                  selectedAffiliateId={form.selectedAffiliateId}
                  onSelect={form.setSelectedAffiliateId}
                />
              )}
            </div>

            {/* Row 2: Sélection + Client */}
            {form.selectedAffiliateId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SelectionListSection
                  selections={form.selections}
                  selectionsLoading={form.selectionsLoading}
                  selectedSelectionId={form.selectedSelectionId}
                  onSelect={form.setSelectedSelectionId}
                  onPreview={form.setPreviewSelectionId}
                />
                {form.selectedSelectionId && (
                  <CustomerSection
                    customerType={form.customerType}
                    onCustomerTypeChange={type => {
                      form.setCustomerType(type);
                      form.setSelectedCustomerId('');
                    }}
                    searchQuery={form.searchQuery}
                    onSearchQueryChange={form.setSearchQuery}
                    showCreateForm={form.showCreateForm}
                    onToggleCreateForm={() =>
                      form.setShowCreateForm(!form.showCreateForm)
                    }
                    filteredOrganisations={form.filteredOrganisations}
                    filteredIndividuals={form.filteredIndividuals}
                    customersLoading={form.customers.isLoading}
                    selectedCustomerId={form.selectedCustomerId}
                    onSelectCustomer={form.setSelectedCustomerId}
                    newCustomerName={form.newCustomerName}
                    onNewCustomerNameChange={form.setNewCustomerName}
                    newCustomerFirstName={form.newCustomerFirstName}
                    onNewCustomerFirstNameChange={form.setNewCustomerFirstName}
                    newCustomerLastName={form.newCustomerLastName}
                    onNewCustomerLastNameChange={form.setNewCustomerLastName}
                    newCustomerEmail={form.newCustomerEmail}
                    onNewCustomerEmailChange={form.setNewCustomerEmail}
                    newCustomerPhone={form.newCustomerPhone}
                    onNewCustomerPhoneChange={form.setNewCustomerPhone}
                    newOrgOwnershipType={form.newOrgOwnershipType}
                    onNewOrgOwnershipTypeChange={form.setNewOrgOwnershipType}
                    newOrgAddress={form.newOrgAddress}
                    onNewOrgAddressChange={form.setNewOrgAddress}
                    newOrgPostalCode={form.newOrgPostalCode}
                    onNewOrgPostalCodeChange={form.setNewOrgPostalCode}
                    newOrgCity={form.newOrgCity}
                    onNewOrgCityChange={form.setNewOrgCity}
                    isCreatingCustomer={
                      form.createOrganisation.isPending ||
                      form.createIndividualCustomer.isPending
                    }
                    onCreateCustomer={() => {
                      void form.handleCreateCustomer().catch(error => {
                        console.error(
                          '[CreateLinkMeOrderModal] handleCreateCustomer failed:',
                          error
                        );
                      });
                    }}
                    onCancelCreateForm={() => form.setShowCreateForm(false)}
                  />
                )}
              </div>
            )}

            {/* Résumé client sélectionné */}
            {form.selectedCustomer && (
              <CustomerSummaryCard
                customer={form.selectedCustomer}
                customerType={form.customerType}
                onDeselect={() => form.setSelectedCustomerId('')}
              />
            )}

            {/* Contacts & Adresses */}
            {form.selectedCustomerId &&
              form.customerType === 'organization' && (
                <ContactsAddressesSection
                  organisationId={form.selectedCustomerId}
                  data={form.contactsAddressesData}
                  onUpdate={updates =>
                    form.setContactsAddressesData(prev => ({
                      ...prev,
                      ...updates,
                    }))
                  }
                  visible
                />
              )}

            {/* Row 3: Frais + Options livraison */}
            {form.selectedSelectionId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AdditionalCostsSection
                  shippingCostHt={form.shippingCostHt}
                  onShippingCostHtChange={form.setShippingCostHt}
                  handlingCostHt={form.handlingCostHt}
                  onHandlingCostHtChange={form.setHandlingCostHt}
                  insuranceCostHt={form.insuranceCostHt}
                  onInsuranceCostHtChange={form.setInsuranceCostHt}
                  fraisTaxRate={form.fraisTaxRate}
                  onFraisTaxRateChange={form.setFraisTaxRate}
                />
                {form.selectedCustomerId && (
                  <DeliveryOptionsSection
                    expectedDeliveryDate={form.expectedDeliveryDate}
                    onExpectedDeliveryDateChange={form.setExpectedDeliveryDate}
                    isShoppingCenterDelivery={form.isShoppingCenterDelivery}
                    onIsShoppingCenterDeliveryChange={
                      form.setIsShoppingCenterDelivery
                    }
                    acceptsSemiTruck={form.acceptsSemiTruck}
                    onAcceptsSemiTruckChange={form.setAcceptsSemiTruck}
                  />
                )}
              </div>
            )}

            {/* Row 4: Produits + Panier */}
            {form.selectedSelectionId && form.selectedCustomerId && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <ProductSelectionSection
                    selectionDetails={form.selectionDetails}
                    selectionDetailsLoading={form.selectionDetailsLoading}
                    filteredSelectionItems={form.filteredSelectionItems}
                    cart={form.cart}
                    productSearchQuery={form.productSearchQuery}
                    onProductSearchQueryChange={form.setProductSearchQuery}
                    selectedSubcategoryId={form.selectedSubcategoryId}
                    onSelectedSubcategoryIdChange={
                      form.setSelectedSubcategoryId
                    }
                    onAddProduct={form.addProductFromSelection}
                  />
                </div>
                <div className="lg:col-span-2">
                  <CartSection
                    cart={form.cart}
                    cartTotals={form.cartTotals}
                    onUpdateQuantity={form.updateQuantity}
                    onRemoveFromCart={form.removeFromCart}
                    onUpdateUnitPrice={form.updateUnitPrice}
                    onUpdateRetrocessionRate={form.updateRetrocessionRate}
                  />
                </div>
              </div>
            )}

            {/* Date + Notes */}
            {form.selectedSelectionId && (
              <OrderDateNotesSection
                orderDate={form.orderDate}
                onOrderDateChange={form.setOrderDate}
                internalNotes={form.internalNotes}
                onInternalNotesChange={form.setInternalNotes}
              />
            )}

            {/* Erreur */}
            {form.createOrder.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {form.createOrder.error instanceof Error
                    ? form.createOrder.error.message
                    : 'Erreur lors de la création'}
                </p>
              </div>
            )}
          </div>
          {/* END COLONNE GAUCHE */}

          {/* COLONNE DROITE - Résumé sticky */}
          <div className="hidden lg:block">
            <OrderSummaryPanel
              items={form.cart.map(item => ({
                name: item.product_name,
                quantity: item.quantity,
                totalHt: item.unit_price_ht * item.quantity,
              }))}
              subtotalHt={form.cartTotals.productsHt}
              totalCharges={form.cartTotals.totalFrais}
              totalTva={form.cartTotals.totalTva}
              totalTtc={form.cartTotals.totalTtc}
              onSubmit={() => {
                void form.handleSubmit().catch(error => {
                  console.error(
                    '[CreateLinkMeOrderModal] handleSubmit failed:',
                    error
                  );
                });
              }}
              onCancel={onClose}
              submitLabel="Créer la commande LinkMe"
              submitDisabled={!form.canSubmit}
              loading={form.createOrder.isPending}
              extraContent={
                form.cartTotals.totalRetrocession > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Marge affilié</span>
                      <span>
                        -{formatCurrency(form.cartTotals.totalRetrocession)}
                      </span>
                    </div>
                  </div>
                ) : undefined
              }
            />
          </div>
        </div>
      </div>

      {/* Footer mobile */}
      <div className="lg:hidden flex gap-3 px-8 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            void form.handleSubmit().catch(error => {
              console.error(
                '[CreateLinkMeOrderModal] handleSubmit failed:',
                error
              );
            });
          }}
          disabled={!form.canSubmit || form.createOrder.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {form.createOrder.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Créer la commande
            </>
          )}
        </button>
      </div>

      {/* Dialog Preview Sélection */}
      {form.previewSelectionId && (
        <SelectionPreviewDialog
          previewSelection={form.previewSelection}
          previewLoading={form.previewLoading}
          onClose={() => form.setPreviewSelectionId(null)}
        />
      )}
    </div>
  );
}
