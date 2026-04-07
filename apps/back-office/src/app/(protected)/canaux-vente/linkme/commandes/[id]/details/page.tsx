'use client';

import { AlertCircle } from 'lucide-react';

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

import type { NewContactFormData } from '../../../components/contacts/NewContactForm';

import { useOrderDetailsPage } from './hooks';
import { LeftColumn } from './components/LeftColumn';
import { RightColumn } from './components/RightColumn';
import { EditDialogs } from './components/EditDialogs';
import { OrderHeader } from './components/OrderHeader';

export default function LinkMeOrderDetailsPage() {
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
    selectedContactId,
    setSelectedContactId,
    availableContacts,
    locked,
    fusedContacts,
    deliveryAddressMatchesOrg,
    updateDetails,
    createContactBO,
    handleStatusChange,
    handleSaveItems,
    openEditDialog,
    handleSaveEdit,
    handleConfirmContact,
    handleCreateAndSelectContact,
    handleUpdateOrganisation,
    handleUseOrgAddress,
    handleOpenContactDialog,
    isStep4Complete,
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

  return (
    <div className="space-y-4 p-4">
      <OrderHeader
        order={order}
        locked={locked}
        editOrderDateOpen={editOrderDateOpen}
        setEditOrderDateOpen={setEditOrderDateOpen}
        setEditOrderDateValue={setEditOrderDateValue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LeftColumn
          order={order}
          enrichedItems={enrichedItems}
          locked={locked}
          details={order.linkmeDetails}
          fusedContacts={fusedContacts}
          editedQuantities={editedQuantities}
          setEditedQuantities={setEditedQuantities}
          hasItemChanges={hasItemChanges}
          isSavingItems={isSavingItems}
          onSaveItems={() => {
            void handleSaveItems().catch(err => console.error(err));
          }}
          onOpenEditDialog={openEditDialog}
          onOpenContactDialog={handleOpenContactDialog}
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
          isStep4Complete={isStep4Complete}
          onUpdateOrganisation={handleUpdateOrganisation}
        />

        <RightColumn
          order={order}
          locked={locked}
          fusedContacts={fusedContacts}
          details={order.linkmeDetails}
          isUpdatingStatus={isUpdatingStatus}
          onStatusChange={(newStatus: string) => {
            void handleStatusChange(newStatus).catch(err => console.error(err));
          }}
          onOpenContactDialog={handleOpenContactDialog}
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
      />

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
