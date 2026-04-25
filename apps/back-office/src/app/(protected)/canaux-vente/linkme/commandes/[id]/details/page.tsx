'use client';

import { useState } from 'react';

import { AlertCircle, FileEdit, FileText } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  QuoteCreateFromOrderModal,
  InvoiceCreateFromOrderModal,
  type IOrderForDocument,
} from '@verone/finance/components';
import { SalesOrderShipmentModal } from '@verone/orders';

import type { NewContactFormData } from '../../../components/contacts/NewContactForm';

import { useRequestInfo } from '../../../hooks/use-linkme-order-actions';
import {
  getOrderMissingFields,
  type MissingFieldCategory,
} from '../../../utils/order-missing-fields';
import { RequestInfoDialog } from '../components/ApprovalActionDialogs';
import type { OrderWithDetails as OrderWithDetailsApproval } from '../components/types';
import { useOrderDetailsPage } from './hooks';
import { AddProductToOrderModal } from './components/AddProductToOrderModal';
import { LeftColumn } from './components/LeftColumn';
import { RightColumn } from './components/RightColumn';
import { EditDialogs } from './components/EditDialogs';
import { OrderHeader } from './components/OrderHeader';

export default function LinkMeOrderDetailsPage() {
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<
    Set<MissingFieldCategory>
  >(new Set());
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const requestInfo = useRequestInfo();

  const {
    order,
    setOrder,
    enrichedItems,
    isLoading,
    error,
    historyEvents,
    historyLoading,
    isUpdatingStatus,
    editedQuantities,
    setEditedQuantities,
    editedPrices,
    setEditedPrices,
    editedMargins,
    setEditedMargins,
    showAddProductModal,
    setShowAddProductModal,
    isSavingItems,
    hasItemChanges,
    editingStep,
    setEditingStep,
    editForm,
    setEditForm,
    contactDialogFor,
    setContactDialogFor,
    editOrderDateOpen,
    setEditOrderDateOpen,
    editOrderDateValue,
    setEditOrderDateValue,
    showQuoteModal,
    setShowQuoteModal,
    selectedContactId,
    setSelectedContactId,
    availableContacts,
    orgLabel,
    enseigneLabel,
    locked,
    fusedContacts,
    deliveryAddressMatchesOrg,
    updateDetails,
    createContactBO,
    handleStatusChange,
    handleSaveItems,
    handleDeleteItem,
    handleAddItems,
    openEditDialog,
    handleSaveEdit,
    handleConfirmContact,
    handleCreateAndSelectContact,
    handleUpdateOrganisation,
    handleUseOrgAddress,
    handleOpenContactDialog,
    fetchOrder,
  } = useOrderDetailsPage();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error ?? 'Commande non trouvée'}</span>
        </div>
      </div>
    );
  }

  const details = order.linkmeDetails;
  const missingFieldsResult = details
    ? getOrderMissingFields({
        details,
        responsableContact: order.responsable_contact,
        billingContact: order.billing_contact,
        deliveryContact: order.delivery_contact,
        organisationSiret: order.organisation?.siret,
        organisationCountry: order.organisation?.country,
        organisationVatNumber: order.organisation?.vat_number,
        organisationLegalName: order.organisation?.legal_name,
        organisationBillingAddress: order.organisation?.billing_address_line1,
        organisationBillingPostalCode: order.organisation?.billing_postal_code,
        organisationBillingCity: order.organisation?.billing_city,
        ownerType: details.owner_type,
      })
    : null;

  const handleRequestComplementForRole = (
    role: 'responsable' | 'billing' | 'delivery'
  ) => {
    setSelectedCategories(new Set<MissingFieldCategory>([role]));
    setShowRequestInfoDialog(true);
  };

  const handleRequestInfo = () => {
    if (!requestMessage.trim() || !order) return;
    void requestInfo
      .mutateAsync({
        orderId: order.id,
        customMessage: requestMessage || undefined,
        missingFields: missingFieldsResult
          ? Object.entries(missingFieldsResult.byCategory)
              .filter(([cat]) =>
                selectedCategories.has(cat as MissingFieldCategory)
              )
              .flatMap(([cat, fields]) =>
                fields.map(f => ({
                  key: f.key,
                  label: f.label,
                  category: cat,
                  inputType: f.inputType ?? 'text',
                }))
              )
          : [],
        recipientEmails: selectedEmails.length > 0 ? selectedEmails : undefined,
      })
      .then(() => {
        setShowRequestInfoDialog(false);
        setRequestMessage('');
        setSelectedCategories(new Set());
        setSelectedEmails([]);
      })
      .catch(err => {
        console.error('[LinkMeOrderDetails] Request info failed:', err);
      });
  };

  // Build IOrderForDocument from order data for QuoteCreateFromOrderModal
  const orderForDocument: IOrderForDocument | null =
    order && (order.status === 'draft' || order.status === 'validated')
      ? {
          id: order.id,
          order_number: order.order_number,
          total_ht: order.total_ht,
          total_ttc: order.total_ttc,
          tax_rate: order.tax_rate ?? 0.2,
          currency: order.currency ?? 'EUR',
          customer_id: order.customer_id,
          customer_type: 'organization',
          shipping_cost_ht: order.shipping_cost_ht,
          handling_cost_ht: order.handling_cost_ht,
          insurance_cost_ht: order.insurance_cost_ht,
          fees_vat_rate: order.fees_vat_rate,
          billing_address: order.organisation?.billing_address_line1
            ? {
                address_line1: order.organisation.billing_address_line1,
                postal_code: order.organisation.billing_postal_code ?? '',
                city: order.organisation.billing_city ?? '',
                country: order.organisation.country ?? 'FR',
              }
            : order.organisation?.address_line1
              ? {
                  address_line1: order.organisation.address_line1,
                  postal_code: order.organisation.postal_code ?? '',
                  city: order.organisation.city ?? '',
                  country: order.organisation.country ?? 'FR',
                }
              : null,
          organisations: order.organisation
            ? {
                name:
                  order.organisation.trade_name ??
                  order.organisation.legal_name,
                trade_name: order.organisation.trade_name,
                legal_name: order.organisation.legal_name,
                email: order.organisation.email,
                address_line1: order.organisation.address_line1,
                city: order.organisation.city,
                postal_code: order.organisation.postal_code,
                country: order.organisation.country,
                billing_address_line1: order.organisation.billing_address_line1,
                billing_city: order.organisation.billing_city,
                billing_postal_code: order.organisation.billing_postal_code,
                has_different_shipping_address:
                  order.organisation.has_different_shipping_address,
                shipping_address_line1:
                  order.organisation.shipping_address_line1,
                shipping_city: order.organisation.shipping_city,
                shipping_postal_code: order.organisation.shipping_postal_code,
                siret: order.organisation.siret,
                vat_number: order.organisation.vat_number,
                enseigne_id: order.organisation.enseigne_id,
              }
            : null,
          sales_order_items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            tax_rate: item.tax_rate ?? order.tax_rate ?? 0.2,
            products: item.product ? { name: item.product.name } : null,
          })),
        }
      : null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <OrderHeader
          order={order}
          locked={locked}
          editOrderDateOpen={editOrderDateOpen}
          setEditOrderDateOpen={setEditOrderDateOpen}
          setEditOrderDateValue={setEditOrderDateValue}
        />
        {(order.status === 'draft' || order.status === 'validated') && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuoteModal(true)}
            >
              <FileEdit className="mr-2 h-4 w-4" />
              Créer un devis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvoiceModal(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Créer une facture
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LeftColumn
          order={order}
          enrichedItems={enrichedItems}
          locked={locked}
          details={order.linkmeDetails}
          editedQuantities={editedQuantities}
          setEditedQuantities={setEditedQuantities}
          editedPrices={editedPrices}
          setEditedPrices={setEditedPrices}
          editedMargins={editedMargins}
          setEditedMargins={setEditedMargins}
          hasItemChanges={hasItemChanges}
          isSavingItems={isSavingItems}
          onSaveItems={() => {
            void handleSaveItems().catch(err => console.error(err));
          }}
          onDeleteItem={(itemId: string) => {
            void handleDeleteItem(itemId).catch(err => console.error(err));
          }}
          onOpenAddProduct={() => setShowAddProductModal(true)}
          onOpenEditDialog={openEditDialog}
          deliveryAddressMatchesOrg={deliveryAddressMatchesOrg}
          onUseOrgAddress={() => {
            void handleUseOrgAddress().catch((err: unknown) => {
              console.error(
                '[LinkMeOrderDetails] Use org address failed:',
                err
              );
            });
          }}
          updateDetailsPending={updateDetails.isPending}
          onUpdateOrganisation={handleUpdateOrganisation}
          onRefetchOrder={fetchOrder}
        />

        <RightColumn
          order={order}
          locked={locked}
          fusedContacts={fusedContacts}
          isUpdatingStatus={isUpdatingStatus}
          onStatusChange={(newStatus: string) => {
            void handleStatusChange(newStatus).catch(err => console.error(err));
          }}
          onOpenShipmentModal={() => setShowShipmentModal(true)}
          onOpenContactDialog={handleOpenContactDialog}
          onRequestInfo={() => setShowRequestInfoDialog(true)}
          onRequestComplementForRole={handleRequestComplementForRole}
          missingFieldsTotal={missingFieldsResult?.totalCategories}
          historyEvents={historyEvents}
          historyLoading={historyLoading}
        />
      </div>

      <EditDialogs
        order={order}
        editingStep={editingStep}
        setEditingStep={setEditingStep}
        editForm={editForm}
        setEditForm={setEditForm}
        onSaveEdit={() => {
          void handleSaveEdit().catch(err => {
            console.error('[LinkMeOrderDetails] Save edit failed:', err);
          });
        }}
        updateDetailsPending={updateDetails.isPending}
        contactDialogFor={contactDialogFor}
        setContactDialogFor={setContactDialogFor}
        selectedContactId={selectedContactId}
        setSelectedContactId={setSelectedContactId}
        availableContacts={availableContacts}
        onConfirmContact={() => {
          void handleConfirmContact().catch(err => {
            console.error('[LinkMeOrderDetails] Confirm contact failed:', err);
          });
        }}
        onCreateAndSelectContact={async (data: NewContactFormData) => {
          await handleCreateAndSelectContact(data).catch(err => {
            console.error('[LinkMeOrderDetails] Create contact failed:', err);
          });
        }}
        createContactPending={createContactBO.isPending}
        orgLabel={orgLabel}
        enseigneLabel={enseigneLabel}
      />

      {showAddProductModal && (
        <AddProductToOrderModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          selectionId={order.linkme_selection_id}
          affiliateId={order.created_by_affiliate_id}
          existingProductIds={order.items.map(i => i.product_id)}
          onAddItems={items => {
            void handleAddItems(items).catch(err =>
              console.error('[LinkMeOrderDetails] Add items failed:', err)
            );
          }}
        />
      )}

      {orderForDocument && (
        <QuoteCreateFromOrderModal
          order={orderForDocument}
          open={showQuoteModal}
          onOpenChange={setShowQuoteModal}
        />
      )}

      {orderForDocument && (
        <InvoiceCreateFromOrderModal
          order={orderForDocument}
          open={showInvoiceModal}
          onOpenChange={setShowInvoiceModal}
        />
      )}

      <RequestInfoDialog
        open={showRequestInfoDialog}
        onOpenChange={setShowRequestInfoDialog}
        order={order as unknown as OrderWithDetailsApproval}
        details={details}
        createdByProfile={order.createdByProfile}
        requestMessage={requestMessage}
        setRequestMessage={setRequestMessage}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedEmails={selectedEmails}
        setSelectedEmails={setSelectedEmails}
        onSend={handleRequestInfo}
        isPending={requestInfo.isPending}
      />

      {(order.status === 'validated' ||
        order.status === 'partially_shipped') && (
        <SalesOrderShipmentModal
          order={{ id: order.id, order_number: order.order_number }}
          open={showShipmentModal}
          onClose={() => setShowShipmentModal(false)}
          onSuccess={() => {
            setShowShipmentModal(false);
            window.location.reload();
          }}
        />
      )}

      <Dialog open={editOrderDateOpen} onOpenChange={setEditOrderDateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Modifier la date de commande</DialogTitle>
            <DialogDescription>
              Modifiable uniquement en brouillon.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="date"
              value={editOrderDateValue}
              onChange={e => setEditOrderDateValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOrderDateOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!order || !editOrderDateValue) return;
                const supabase = createClient();
                void supabase
                  .from('sales_orders')
                  .update({ order_date: editOrderDateValue })
                  .eq('id', order.id)
                  .then(({ error: err }) => {
                    if (err) {
                      console.error('[OrderDate] Update failed:', err);
                      return;
                    }
                    setOrder({ ...order, order_date: editOrderDateValue });
                    setEditOrderDateOpen(false);
                  });
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
