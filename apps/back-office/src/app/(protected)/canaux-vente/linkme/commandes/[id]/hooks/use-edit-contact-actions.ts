/**
 * Hook: useEditContactActions
 * Edit dialogs / Contact selection / Org address handlers
 */

import { createClient } from '@verone/utils/supabase/client';

import {
  useUpdateLinkMeDetails,
  type LinkMeOrderDetails,
} from '../../../hooks/use-linkme-order-actions';

import { useCreateContactBO } from '../../../hooks/use-organisation-contacts-bo';
import type { NewContactFormData } from '../../../components/contacts/NewContactForm';
import type { OrderWithDetails } from '../components/types';

// ============================================
// TYPES
// ============================================

type EditStep =
  | 'responsable'
  | 'billing'
  | 'delivery_address'
  | 'delivery_options'
  | null;

type ContactRole = 'responsable' | 'billing' | 'delivery' | null;

export interface UseEditContactActionsParams {
  orderId: string;
  order: OrderWithDetails | null;
  isSuccursale: boolean;
  organisationId: string | null;
  enseigneId: string | null;
  editingStep: EditStep;
  editForm: Partial<LinkMeOrderDetails>;
  contactDialogFor: ContactRole;
  selectedContactId: string | null;
  setEditingStep: (v: EditStep) => void;
  setEditForm: (v: Partial<LinkMeOrderDetails>) => void;
  setContactDialogFor: (v: ContactRole) => void;
  setSelectedContactId: (v: string | null) => void;
  refetch: () => void;
}

// ============================================
// STANDALONE HELPERS (outside hook = 0 fn lines)
// ============================================

function getEditFormForStep(
  d: LinkMeOrderDetails,
  step: NonNullable<EditStep>
): Partial<LinkMeOrderDetails> {
  if (step === 'responsable')
    return {
      requester_type: d.requester_type,
      requester_name: d.requester_name,
      requester_email: d.requester_email,
      requester_phone: d.requester_phone,
      requester_position: d.requester_position,
    };
  if (step === 'billing')
    return {
      billing_contact_source: d.billing_contact_source,
      billing_name: d.billing_name,
      billing_email: d.billing_email,
      billing_phone: d.billing_phone,
    };
  if (step === 'delivery_address')
    return {
      delivery_address: d.delivery_address,
      delivery_postal_code: d.delivery_postal_code,
      delivery_city: d.delivery_city,
    };
  return {
    delivery_notes: d.delivery_notes,
    delivery_terms_accepted: d.delivery_terms_accepted,
    desired_delivery_date: d.desired_delivery_date,
    is_mall_delivery: d.is_mall_delivery,
    mall_email: d.mall_email,
    semi_trailer_accessible: d.semi_trailer_accessible,
    reception_contact_name: d.reception_contact_name,
    reception_contact_email: d.reception_contact_email,
    reception_contact_phone: d.reception_contact_phone,
    confirmed_delivery_date: d.confirmed_delivery_date,
  };
}

function getContactFkField(role: NonNullable<ContactRole>): string {
  if (role === 'responsable') return 'responsable_contact_id';
  if (role === 'billing') return 'billing_contact_id';
  return 'delivery_contact_id';
}

async function updateOrderContactFk(
  orderId: string,
  role: ContactRole,
  contactId: string
): Promise<void> {
  const supabase = createClient();
  const fkField = role ? getContactFkField(role) : 'responsable_contact_id';
  await supabase
    .from('sales_orders')
    .update({ [fkField]: contactId })
    .eq('id', orderId);
}

function buildOrgAddressUpdates(
  org: NonNullable<OrderWithDetails['organisation']>
): Partial<LinkMeOrderDetails> {
  const useShipping = org.has_different_shipping_address;
  return {
    delivery_address: useShipping
      ? [org.shipping_address_line1, org.shipping_address_line2]
          .filter(Boolean)
          .join(', ')
      : [org.address_line1, org.address_line2].filter(Boolean).join(', '),
    delivery_postal_code: useShipping
      ? org.shipping_postal_code
      : org.postal_code,
    delivery_city: useShipping ? org.shipping_city : org.city,
  };
}

function buildCreateContactPayload(
  p: UseEditContactActionsParams,
  data: NewContactFormData
) {
  return {
    organisationId: p.isSuccursale
      ? undefined
      : (p.organisationId ?? undefined),
    enseigneId: p.isSuccursale ? (p.enseigneId ?? undefined) : undefined,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone || undefined,
    title: data.title || undefined,
    isPrimaryContact: p.contactDialogFor === 'responsable',
    isBillingContact: p.contactDialogFor === 'billing',
  };
}

// ============================================
// HOOK
// ============================================

export function useEditContactActions(p: UseEditContactActionsParams) {
  const updateDetails = useUpdateLinkMeDetails();
  const createContactBO = useCreateContactBO();

  const openEditDialog = (step: NonNullable<EditStep>) => {
    if (!p.order?.linkmeDetails) return;
    p.setEditForm(getEditFormForStep(p.order.linkmeDetails, step));
    p.setEditingStep(step);
  };

  const handleSaveEdit = async () => {
    if (!p.editingStep) return;
    try {
      await updateDetails.mutateAsync({
        orderId: p.orderId,
        updates: p.editForm,
      });
      p.setEditingStep(null);
      p.setEditForm({});
      p.refetch();
    } catch (err) {
      console.error('[useEditContactActions] Erreur mise a jour:', err);
    }
  };

  const handleConfirmContact = async () => {
    if (!p.contactDialogFor || !p.selectedContactId) return;
    const supabase = createClient();
    const fkField = getContactFkField(p.contactDialogFor);
    try {
      const { error: updateError } = await supabase
        .from('sales_orders')
        .update({ [fkField]: p.selectedContactId })
        .eq('id', p.orderId);
      if (updateError) throw updateError;
      p.setContactDialogFor(null);
      p.setSelectedContactId(null);
      p.refetch();
    } catch (err) {
      console.error('[useEditContactActions] Erreur contact:', err);
    }
  };

  const handleCreateAndSelectContact = async (data: NewContactFormData) => {
    const result = await createContactBO.mutateAsync(
      buildCreateContactPayload(p, data)
    );
    await updateOrderContactFk(p.orderId, p.contactDialogFor, result.id);
    p.setContactDialogFor(null);
    p.setSelectedContactId(null);
    p.refetch();
  };

  const handleUseOrgAddress = async () => {
    const org = p.order?.organisation;
    if (!org) return;
    await updateDetails.mutateAsync({
      orderId: p.orderId,
      updates: buildOrgAddressUpdates(org),
    });
    p.refetch();
  };

  return {
    updateDetails,
    createContactBO,
    openEditDialog,
    handleSaveEdit,
    handleConfirmContact,
    handleCreateAndSelectContact,
    handleUseOrgAddress,
  };
}
