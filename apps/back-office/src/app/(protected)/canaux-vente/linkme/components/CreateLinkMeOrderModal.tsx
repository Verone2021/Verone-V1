/**
 * @protected — NE PAS MODIFIER SANS APPROBATION ROMEO
 *
 * Modal de creation de commande LinkMe (orchestrateur).
 * Chaque section est un sous-composant dans create-order/.
 * La logique metier est dans useCreateLinkMeOrderForm.
 */
'use client';

import { ShoppingCart, X, AlertCircle, Check, Loader2 } from 'lucide-react';

import { useCreateLinkMeOrderForm } from '../hooks/use-create-linkme-order-form';
import { ContactsAddressesSection } from './contacts';
import { AffiliateTypeSection } from './create-order/AffiliateTypeSection';
import { AffiliateListSection } from './create-order/AffiliateListSection';
import { SelectionListSection } from './create-order/SelectionListSection';
import { SelectionPreviewDialog } from './create-order/SelectionPreviewDialog';
import { CustomerSection } from './create-order/CustomerSection';
import { CustomerSummaryCard } from './create-order/CustomerSummaryCard';
import { AdditionalCostsSection } from './create-order/AdditionalCostsSection';
import { ProductSelectionSection } from './create-order/ProductSelectionSection';
import { CartSection } from './create-order/CartSection';
import { OrderDateNotesSection } from './create-order/OrderDateNotesSection';
import { OrderSummarySection } from './create-order/OrderSummarySection';

interface CreateLinkMeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAffiliateId?: string;
}

/**
 * Modal de création de commande LinkMe
 * Orchestrateur — la logique est dans useCreateLinkMeOrderForm,
 * chaque section JSX est un sous-composant dans create-order/
 */
export function CreateLinkMeOrderModal({
  isOpen,
  onClose,
  preselectedAffiliateId,
}: CreateLinkMeOrderModalProps) {
  const form = useCreateLinkMeOrderForm({
    isOpen,
    onClose,
    preselectedAffiliateId,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-end md:items-center justify-center md:p-4">
        <div className="relative bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full md:max-w-3xl h-full md:h-auto md:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Type d'affilié */}
            <AffiliateTypeSection
              affiliateType={form.affiliateType}
              onSelect={form.setAffiliateType}
            />

            {/* Section 2: Affilié */}
            {form.affiliateType && (
              <AffiliateListSection
                affiliates={form.affiliates}
                isLoading={form.affiliatesLoading}
                selectedId={form.selectedAffiliateId}
                onSelect={form.setSelectedAffiliateId}
              />
            )}

            {/* Section 3: Sélection */}
            {form.selectedAffiliateId && (
              <SelectionListSection
                selections={form.selections}
                isLoading={form.selectionsLoading}
                selectedId={form.selectedSelectionId}
                onSelect={form.setSelectedSelectionId}
                onPreview={form.setPreviewSelectionId}
              />
            )}

            {/* Section 4: Client */}
            {form.selectedSelectionId && form.selectedAffiliateId && (
              <CustomerSection
                customerType={form.customerType}
                onCustomerTypeChange={form.setCustomerType}
                selectedCustomerId={form.selectedCustomerId}
                onSelectCustomer={form.setSelectedCustomerId}
                searchQuery={form.searchQuery}
                onSearchChange={form.setSearchQuery}
                isLoading={form.customers.isLoading}
                filteredOrganisations={form.filteredOrganisations}
                filteredIndividuals={form.filteredIndividuals}
                enseigneId={form.selectedAffiliate?.enseigne_id}
                onOrganisationCreated={orgId => {
                  form.setSelectedCustomerId(orgId);
                  form.customers.refetch();
                }}
                onIndividualCreated={customerId => {
                  form.setSelectedCustomerId(customerId);
                  form.customers.refetch();
                }}
              />
            )}

            {/* Section 4 bis: Résumé client */}
            {form.selectedCustomer && (
              <CustomerSummaryCard
                customerType={form.customerType}
                selectedCustomer={form.selectedCustomer}
                onClear={() => form.setSelectedCustomerId('')}
              />
            )}

            {/* Section 5: Contacts & Adresses */}
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

            {/* Section: Frais additionnels */}
            {form.selectedSelectionId && (
              <AdditionalCostsSection
                shippingCostHt={form.shippingCostHt}
                onShippingChange={form.setShippingCostHt}
                handlingCostHt={form.handlingCostHt}
                onHandlingChange={form.setHandlingCostHt}
                insuranceCostHt={form.insuranceCostHt}
                onInsuranceChange={form.setInsuranceCostHt}
                fraisTaxRate={form.fraisTaxRate}
                onFraisTaxRateChange={form.setFraisTaxRate}
              />
            )}

            {/* Section: Produits */}
            {form.selectedSelectionId && form.selectedCustomerId && (
              <ProductSelectionSection
                items={form.filteredSelectionItems}
                isLoading={form.selectionDetailsLoading}
                totalCount={form.selectionDetails?.items?.length ?? 0}
                searchQuery={form.productSearchQuery}
                onSearchChange={form.setProductSearchQuery}
                selectedSubcategoryId={form.selectedSubcategoryId}
                onSubcategoryChange={form.setSelectedSubcategoryId}
                cart={form.cart}
                onAddProduct={form.addProductFromSelection}
              />
            )}

            {/* Section: Panier */}
            {form.cart.length > 0 && (
              <CartSection
                cart={form.cart}
                cartTotals={form.cartTotals}
                updateQuantity={form.updateQuantity}
                updateUnitPrice={form.updateUnitPrice}
                updateRetrocessionRate={form.updateRetrocessionRate}
                updateCommissionRate={form.updateCommissionRate}
                removeFromCart={form.removeFromCart}
              />
            )}

            {/* Section: Date + Notes */}
            {form.selectedSelectionId && (
              <OrderDateNotesSection
                orderDate={form.orderDate}
                onDateChange={form.setOrderDate}
                internalNotes={form.internalNotes}
                onNotesChange={form.setInternalNotes}
              />
            )}

            {/* Section: Récapitulatif */}
            {form.canSubmit && (
              <OrderSummarySection
                customerType={form.customerType}
                selectedCustomer={form.selectedCustomer}
                affiliateDisplayName={form.selectedAffiliate?.display_name}
                affiliateType={form.affiliateType}
                cart={form.cart}
                cartTotals={form.cartTotals}
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

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
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
        </div>
      </div>

      {/* Dialog Preview Sélection */}
      {form.previewSelectionId && (
        <SelectionPreviewDialog
          selectionName={form.previewSelection?.name}
          items={form.previewSelection?.items}
          isLoading={form.previewLoading}
          onClose={() => form.setPreviewSelectionId(null)}
        />
      )}
    </div>
  );
}
