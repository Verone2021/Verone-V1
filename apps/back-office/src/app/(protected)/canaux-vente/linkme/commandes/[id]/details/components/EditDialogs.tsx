'use client';

import type { LinkMeOrderDetails } from '../../../../hooks/use-linkme-order-actions';
import type { ContactBO } from '../../../../hooks/use-organisation-contacts-bo';
import type { NewContactFormData } from '../../../../components/contacts/NewContactForm';
import type { OrderWithDetails } from './types';

import { ContactSelectionDialog } from './ContactSelectionDialog';
import { EditResponsableDialog } from './EditResponsableDialog';
import { EditBillingDialog } from './EditBillingDialog';
import { EditDeliveryAddressDialog } from './EditDeliveryAddressDialog';
import { EditDeliveryOptionsDialog } from './EditDeliveryOptionsDialog';

export interface EditDialogsProps {
  order: OrderWithDetails;
  editingStep:
    | 'responsable'
    | 'billing'
    | 'delivery_address'
    | 'delivery_options'
    | null;
  setEditingStep: (
    step:
      | 'responsable'
      | 'billing'
      | 'delivery_address'
      | 'delivery_options'
      | null
  ) => void;
  editForm: Partial<LinkMeOrderDetails>;
  setEditForm: React.Dispatch<
    React.SetStateAction<Partial<LinkMeOrderDetails>>
  >;
  onSaveEdit: () => void;
  updateDetailsPending: boolean;
  contactDialogFor: 'responsable' | 'billing' | 'delivery' | null;
  setContactDialogFor: (
    role: 'responsable' | 'billing' | 'delivery' | null
  ) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  availableContacts: ContactBO[];
  onConfirmContact: () => void;
  onCreateAndSelectContact: (data: NewContactFormData) => Promise<void>;
  createContactPending: boolean;
}

export function EditDialogs({
  order,
  editingStep,
  setEditingStep,
  editForm,
  setEditForm,
  onSaveEdit,
  updateDetailsPending,
  contactDialogFor,
  setContactDialogFor,
  selectedContactId,
  setSelectedContactId,
  availableContacts,
  onConfirmContact,
  onCreateAndSelectContact,
  createContactPending,
}: EditDialogsProps) {
  const sharedEditProps = {
    editForm,
    setEditForm,
    onSaveEdit,
    updateDetailsPending,
    onClose: () => setEditingStep(null),
  };

  return (
    <>
      <ContactSelectionDialog
        contactDialogFor={contactDialogFor}
        setContactDialogFor={setContactDialogFor}
        selectedContactId={selectedContactId}
        setSelectedContactId={setSelectedContactId}
        availableContacts={availableContacts}
        onConfirmContact={onConfirmContact}
        onCreateAndSelectContact={onCreateAndSelectContact}
        createContactPending={createContactPending}
        updateDetailsPending={updateDetailsPending}
      />
      <EditResponsableDialog
        open={editingStep === 'responsable'}
        {...sharedEditProps}
      />
      <EditBillingDialog
        open={editingStep === 'billing'}
        {...sharedEditProps}
      />
      <EditDeliveryAddressDialog
        open={editingStep === 'delivery_address'}
        order={order}
        {...sharedEditProps}
      />
      <EditDeliveryOptionsDialog
        open={editingStep === 'delivery_options'}
        order={order}
        {...sharedEditProps}
      />
    </>
  );
}
