'use client';

/**
 * EditOrderPage - Page complete d'edition de commande brouillon
 *
 * Sections accordion:
 * 1. Produits (ouverte par defaut) - modifier qte, supprimer, ajouter
 * 2. Contact responsable - selection vignettes ContactCard
 * 3. Facturation - ContactCard + AddressCard
 * 4. Livraison - ContactCard + AddressCard + options
 * 5. Resume sticky bottom - totaux + boutons
 *
 * @module EditOrderPage
 * @since 2026-02-16
 */

import { useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { Accordion } from '@verone/ui';

import { useOrganisationContacts } from '../../../../../lib/hooks/use-organisation-contacts';
import { useEntityAddresses } from '../../../../../lib/hooks/use-entity-addresses';
import { useEnseigneId } from '../../../../../lib/hooks/use-enseigne-id';
import { usePermissions } from '../../../../../hooks/use-permissions';
import { AddProductDialog } from './AddProductDialog';
import {
  ProductsSection,
  ResponsableSection,
  BillingSection,
  ShippingSection,
  StickyBottomBar,
} from './components';
import { EditOrderHeader } from './components/EditOrderHeader';
import type { FullOrderData } from './page';
import { formatPrice } from './helpers';
import { useEditOrderItems } from './hooks/use-edit-order-items';
import { useEditOrderContacts } from './hooks/use-edit-order-contacts';
import { useEditOrderAddresses } from './hooks/use-edit-order-addresses';
import { useEditOrderDelivery } from './hooks/use-edit-order-delivery';
import { useEditOrderSave } from './hooks/use-edit-order-save';

// ============================================================================
// TYPES
// ============================================================================

interface EditOrderPageProps {
  data: FullOrderData;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EditOrderPage({ data }: EditOrderPageProps) {
  const router = useRouter();
  const { order, details, selectionId } = data;

  // ---- Hooks: contacts & addresses data ----
  const organisationId = order.customer_id;
  const enseigneId = useEnseigneId();
  const { canViewCommissions } = usePermissions();
  const ownershipType =
    (order.customer?.ownership_type as
      | 'propre'
      | 'succursale'
      | 'franchise'
      | null) ?? null;

  // Contacts with enseigne (responsable + billing)
  const { data: contactsWithEnseigne } = useOrganisationContacts(
    organisationId,
    enseigneId,
    ownershipType,
    true
  );
  // Contacts local only (shipping)
  const { data: contactsLocalOnly } = useOrganisationContacts(
    organisationId,
    enseigneId,
    ownershipType,
    false
  );
  // Billing addresses
  const { data: billingAddressesData } = useEntityAddresses(
    'organisation',
    organisationId,
    'billing'
  );
  // Shipping addresses
  const { data: shippingAddressesData } = useEntityAddresses(
    'organisation',
    organisationId,
    'shipping'
  );

  const allContacts = useMemo(
    () => contactsWithEnseigne?.contacts ?? [],
    [contactsWithEnseigne]
  );
  const localContacts = useMemo(
    () => contactsLocalOnly?.contacts ?? [],
    [contactsLocalOnly]
  );
  // Billing contacts: franchise → org contacts only, succursale/propre → enseigne contacts
  const billingContacts = useMemo(
    () => (ownershipType === 'franchise' ? localContacts : allContacts),
    [ownershipType, localContacts, allContacts]
  );

  // Filtered contacts by badge for each section
  const responsableContacts = useMemo(
    () =>
      allContacts.filter(
        c => c.isPrimaryContact || (!c.isBillingContact && !c.isPrimaryContact)
      ),
    [allContacts]
  );
  const billingFilteredContacts = useMemo(
    () => billingContacts.filter(c => c.isBillingContact),
    [billingContacts]
  );
  const deliveryFilteredContacts = useMemo(
    () =>
      localContacts.filter(
        c => c.isPrimaryContact || (!c.isBillingContact && !c.isPrimaryContact)
      ),
    [localContacts]
  );

  const billingAddresses = useMemo(
    () => billingAddressesData?.all ?? [],
    [billingAddressesData]
  );
  const shippingAddresses = useMemo(
    () => shippingAddressesData?.all ?? [],
    [shippingAddressesData]
  );

  // ---- Business hooks ----
  const itemsHook = useEditOrderItems(
    order.sales_order_items,
    order.shipping_cost_ht
  );

  const contactsHook = useEditOrderContacts({
    order,
    details,
    allContacts,
    localContacts,
  });

  const addressesHook = useEditOrderAddresses({
    order,
    details,
    billingAddresses,
    shippingAddresses,
  });

  const deliveryHook = useEditOrderDelivery(details);

  const saveHook = useEditOrderSave({
    orderId: order.id,
    details,
    items: itemsHook.items,
    desiredDeliveryDate: deliveryHook.desiredDeliveryDate,
    resolvedResponsable: contactsHook.resolvedResponsable,
    resolvedBillingContact: contactsHook.resolvedBillingContact,
    resolvedDeliveryContact: contactsHook.resolvedDeliveryContact,
    resolvedDeliveryAddress: addressesHook.resolvedDeliveryAddress,
    isMallDelivery: deliveryHook.isMallDelivery,
    mallEmail: deliveryHook.mallEmail,
    semiTrailerAccessible: deliveryHook.semiTrailerAccessible,
    deliveryNotes: deliveryHook.deliveryNotes,
  });

  // ---- State: dialog ----
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <EditOrderHeader order={order} />

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 pb-32">
        <Accordion
          type="multiple"
          defaultValue={['products']}
          className="space-y-4"
        >
          <ProductsSection
            items={itemsHook.items}
            activeItemsCount={itemsHook.activeItemsCount}
            productsHt={itemsHook.totals.productsHt}
            selectionId={selectionId}
            formatPrice={formatPrice}
            updateQuantity={itemsHook.updateQuantity}
            setQuantity={itemsHook.setQuantity}
            toggleDeleteItem={itemsHook.toggleDeleteItem}
            removeNewItem={itemsHook.removeNewItem}
            updateItemPrice={itemsHook.updateItemPrice}
            onAddProductOpen={() => setIsAddProductOpen(true)}
          />

          <ResponsableSection
            resolvedResponsable={contactsHook.resolvedResponsable}
            allContacts={responsableContacts}
            selectedResponsableId={contactsHook.selectedResponsableId}
            showResponsableForm={contactsHook.showResponsableForm}
            responsableForm={contactsHook.responsableForm}
            onSelectResponsable={contactsHook.handleSelectResponsable}
            onNewResponsable={contactsHook.handleNewResponsable}
            onResponsableFormChange={contactsHook.setResponsableForm}
          />

          <BillingSection
            resolvedBillingContact={contactsHook.resolvedBillingContact}
            allContacts={billingFilteredContacts}
            billingContactMode={contactsHook.billingContactMode}
            selectedBillingContactId={contactsHook.selectedBillingContactId}
            billingContactForm={contactsHook.billingContactForm}
            billingAddresses={billingAddresses}
            billingAddressMode={addressesHook.billingAddressMode}
            selectedBillingAddressId={addressesHook.selectedBillingAddressId}
            onBillingSameAsResponsable={
              contactsHook.handleBillingSameAsResponsable
            }
            onSelectBillingContact={contactsHook.handleSelectBillingContact}
            onNewBillingContact={contactsHook.handleNewBillingContact}
            onBillingContactFormChange={contactsHook.setBillingContactForm}
            onBillingAddressModeChange={addressesHook.setBillingAddressMode}
            onSelectBillingAddress={addressId => {
              addressesHook.setBillingAddressMode('existing');
              addressesHook.setSelectedBillingAddressId(addressId);
            }}
          />

          <ShippingSection
            resolvedDeliveryAddress={addressesHook.resolvedDeliveryAddress}
            desiredDeliveryDate={deliveryHook.desiredDeliveryDate}
            localContacts={deliveryFilteredContacts}
            selectedDeliveryContactId={contactsHook.selectedDeliveryContactId}
            showDeliveryContactForm={contactsHook.showDeliveryContactForm}
            deliveryContactForm={contactsHook.deliveryContactForm}
            shippingAddresses={shippingAddresses}
            deliveryAddressMode={addressesHook.deliveryAddressMode}
            selectedDeliveryAddressId={addressesHook.selectedDeliveryAddressId}
            newDeliveryAddress={addressesHook.newDeliveryAddress}
            isMallDelivery={deliveryHook.isMallDelivery}
            mallEmail={deliveryHook.mallEmail}
            semiTrailerAccessible={deliveryHook.semiTrailerAccessible}
            deliveryNotes={deliveryHook.deliveryNotes}
            onSelectDeliveryContact={contactsHook.handleSelectDeliveryContact}
            onNewDeliveryContact={contactsHook.handleNewDeliveryContact}
            onDeliveryContactFormChange={contactsHook.setDeliveryContactForm}
            onDeliveryAddressModeChange={addressesHook.setDeliveryAddressMode}
            onSelectDeliveryAddress={addressId => {
              addressesHook.setSelectedDeliveryAddressId(addressId);
            }}
            onNewDeliveryAddressChange={addressesHook.setNewDeliveryAddress}
            onDesiredDeliveryDateChange={deliveryHook.setDesiredDeliveryDate}
            onIsMallDeliveryChange={deliveryHook.setIsMallDelivery}
            onMallEmailChange={deliveryHook.setMallEmail}
            onSemiTrailerAccessibleChange={
              deliveryHook.setSemiTrailerAccessible
            }
            onDeliveryNotesChange={deliveryHook.setDeliveryNotes}
          />
        </Accordion>
      </div>

      <StickyBottomBar
        totals={itemsHook.totals}
        canViewCommissions={canViewCommissions}
        hasChanges={saveHook.hasChanges}
        isPending={saveHook.isPending}
        showSaveConfirmation={showSaveConfirmation}
        formatPrice={formatPrice}
        onCancel={() => router.push('/commandes')}
        onSaveClick={() => setShowSaveConfirmation(true)}
        onSaveConfirmationChange={setShowSaveConfirmation}
        onConfirmSave={() => {
          void saveHook.handleSave().catch(err => {
            console.error('[EditOrderPage] Save failed:', err);
          });
        }}
      />

      {/* Add product dialog */}
      {selectionId && (
        <AddProductDialog
          open={isAddProductOpen}
          onOpenChange={setIsAddProductOpen}
          selectionId={selectionId}
          existingProductIds={itemsHook.existingProductIds}
          canViewCommissions={canViewCommissions}
          onAdd={itemsHook.handleAddProducts}
        />
      )}
    </div>
  );
}

export default EditOrderPage;
