import { useState, useMemo, useCallback, useEffect } from 'react';

import type { OrganisationContact } from '../../../../../../lib/hooks/use-organisation-contacts';
import type { ContactFormData } from '../types';
import type { FullOrderData } from '../page';
import { emptyContactForm, findContactMatch } from '../helpers';

// ============================================================================
// TYPES
// ============================================================================

interface UseEditOrderContactsParams {
  order: FullOrderData['order'];
  details: FullOrderData['details'];
  allContacts: OrganisationContact[];
  localContacts: OrganisationContact[];
}

// ============================================================================
// HOOK
// ============================================================================

export function useEditOrderContacts({
  order,
  details,
  allContacts,
  localContacts,
}: UseEditOrderContactsParams) {
  // ---- State: Responsable ----
  // Initialize with contact IDs from sales_orders (avoids race condition with async contacts)
  const [selectedResponsableId, setSelectedResponsableId] = useState<
    string | null
  >(order.responsable_contact_id ?? null);
  const [showResponsableForm, setShowResponsableForm] = useState(false);
  const [responsableForm, setResponsableForm] =
    useState<ContactFormData>(emptyContactForm);

  // ---- State: Billing contact ----
  const [billingContactMode, setBillingContactMode] = useState<
    'same' | 'existing' | 'new'
  >(() => {
    if (
      order.billing_contact_id &&
      order.billing_contact_id !== order.responsable_contact_id
    ) {
      return 'existing';
    }
    return 'same';
  });
  const [selectedBillingContactId, setSelectedBillingContactId] = useState<
    string | null
  >(() => {
    if (
      order.billing_contact_id &&
      order.billing_contact_id !== order.responsable_contact_id
    ) {
      return order.billing_contact_id;
    }
    return null;
  });
  const [billingContactForm, setBillingContactForm] =
    useState<ContactFormData>(emptyContactForm);

  // ---- State: Delivery contact ----
  const [selectedDeliveryContactId, setSelectedDeliveryContactId] = useState<
    string | null
  >(order.delivery_contact_id ?? null);
  const [showDeliveryContactForm, setShowDeliveryContactForm] = useState(false);
  const [deliveryContactForm, setDeliveryContactForm] =
    useState<ContactFormData>(emptyContactForm);

  // ---- Pre-selection: match existing data with contacts ----
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize form from details — use contact IDs first, fallback to name/email matching
  useEffect(() => {
    if (hasInitialized) return;
    if (!details) return;

    // --- Responsable ---
    // Priority 1: Use contact ID directly from sales_orders
    if (order.responsable_contact_id) {
      setSelectedResponsableId(order.responsable_contact_id);
    } else {
      // Priority 2: Match by name/email (legacy orders without contact IDs)
      const respMatch = findContactMatch(
        allContacts,
        details.requester_name,
        details.requester_email
      );
      if (respMatch) {
        setSelectedResponsableId(respMatch);
      } else if (details.requester_name) {
        const nameParts = (details.requester_name ?? '').split(' ');
        setShowResponsableForm(true);
        setResponsableForm({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' '),
          email: details.requester_email ?? '',
          phone: details.requester_phone ?? '',
          title: details.requester_position ?? '',
        });
      }
    }

    // --- Billing contact ---
    if (order.billing_contact_id) {
      // Use ID directly — check if same as responsable
      if (order.billing_contact_id === order.responsable_contact_id) {
        setBillingContactMode('same');
      } else {
        setBillingContactMode('existing');
        setSelectedBillingContactId(order.billing_contact_id);
      }
    } else if (details.billing_name) {
      // Fallback: match by name/email
      const billingMatch = findContactMatch(
        allContacts,
        details.billing_name,
        details.billing_email
      );
      if (billingMatch) {
        setBillingContactMode('existing');
        setSelectedBillingContactId(billingMatch);
      } else if (
        details.billing_name === details.requester_name &&
        details.billing_email === details.requester_email
      ) {
        setBillingContactMode('same');
      } else {
        setBillingContactMode('new');
        const nameParts = (details.billing_name ?? '').split(' ');
        setBillingContactForm({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' '),
          email: details.billing_email ?? '',
          phone: details.billing_phone ?? '',
          title: '',
        });
      }
    }

    // --- Delivery contact ---
    // Delivery contacts are local to the restaurant (not stored in contacts table for succursales)
    // Use ID if available, otherwise fallback to name/email matching
    if (order.delivery_contact_id) {
      setSelectedDeliveryContactId(order.delivery_contact_id);
    } else if (details.delivery_contact_name) {
      const delMatch = findContactMatch(
        localContacts,
        details.delivery_contact_name,
        details.delivery_contact_email
      );
      if (delMatch) {
        setSelectedDeliveryContactId(delMatch);
      } else {
        setShowDeliveryContactForm(true);
        const nameParts = (details.delivery_contact_name ?? '').split(' ');
        setDeliveryContactForm({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' '),
          email: details.delivery_contact_email ?? '',
          phone: details.delivery_contact_phone ?? '',
          title: '',
        });
      }
    }

    setHasInitialized(true);
  }, [
    allContacts,
    localContacts,
    details,
    hasInitialized,
    order.responsable_contact_id,
    order.billing_contact_id,
    order.delivery_contact_id,
  ]);

  // Re-match contacts when they load AFTER initialization
  // (e.g. org has no contacts initially, but they load async later)
  useEffect(() => {
    if (!hasInitialized || !details) return;

    // Re-match responsable: if form is shown (no initial match), try again
    if (showResponsableForm && !selectedResponsableId && allContacts.length) {
      const match = findContactMatch(
        allContacts,
        details.requester_name,
        details.requester_email
      );
      if (match) {
        setSelectedResponsableId(match);
        setShowResponsableForm(false);
      }
    }

    // Re-match billing: if mode is 'new' (no initial match), try again
    if (
      billingContactMode === 'new' &&
      !selectedBillingContactId &&
      allContacts.length
    ) {
      const match = findContactMatch(
        allContacts,
        details.billing_name,
        details.billing_email
      );
      if (match) {
        setBillingContactMode('existing');
        setSelectedBillingContactId(match);
      }
    }

    // Re-match delivery: if form is shown (no initial match), try again
    if (
      showDeliveryContactForm &&
      !selectedDeliveryContactId &&
      localContacts.length
    ) {
      const match = findContactMatch(
        localContacts,
        details.delivery_contact_name,
        details.delivery_contact_email
      );
      if (match) {
        setSelectedDeliveryContactId(match);
        setShowDeliveryContactForm(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally limited deps: only re-run when contacts load
  }, [allContacts, localContacts]);

  // ---- Computed: Resolved contacts ----
  const resolvedResponsable = useMemo(() => {
    if (selectedResponsableId) {
      const c = allContacts.find(c => c.id === selectedResponsableId);
      if (c)
        return {
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone ?? c.mobile ?? '',
        };
    }
    if (showResponsableForm) {
      return {
        name: `${responsableForm.firstName} ${responsableForm.lastName}`.trim(),
        email: responsableForm.email,
        phone: responsableForm.phone,
      };
    }
    return { name: '', email: '', phone: '' };
  }, [
    selectedResponsableId,
    allContacts,
    showResponsableForm,
    responsableForm,
  ]);

  const resolvedBillingContact = useMemo(() => {
    if (billingContactMode === 'same') return resolvedResponsable;
    if (billingContactMode === 'existing' && selectedBillingContactId) {
      // Search in allContacts (not billingContacts) to resolve any pre-selected contact by ID
      const c = allContacts.find(c => c.id === selectedBillingContactId);
      if (c)
        return {
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone ?? c.mobile ?? '',
        };
    }
    if (billingContactMode === 'new') {
      return {
        name: `${billingContactForm.firstName} ${billingContactForm.lastName}`.trim(),
        email: billingContactForm.email,
        phone: billingContactForm.phone,
      };
    }
    return { name: '', email: '', phone: '' };
  }, [
    billingContactMode,
    selectedBillingContactId,
    allContacts,
    billingContactForm,
    resolvedResponsable,
  ]);

  const resolvedDeliveryContact = useMemo(() => {
    if (selectedDeliveryContactId) {
      const c = localContacts.find(c => c.id === selectedDeliveryContactId);
      if (c)
        return {
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone ?? c.mobile ?? '',
        };
    }
    if (showDeliveryContactForm) {
      return {
        name: `${deliveryContactForm.firstName} ${deliveryContactForm.lastName}`.trim(),
        email: deliveryContactForm.email,
        phone: deliveryContactForm.phone,
      };
    }
    return { name: '', email: '', phone: '' };
  }, [
    selectedDeliveryContactId,
    localContacts,
    showDeliveryContactForm,
    deliveryContactForm,
  ]);

  // ---- Handlers: Contact selection ----
  const handleSelectResponsable = useCallback((contactId: string) => {
    setSelectedResponsableId(contactId);
    setShowResponsableForm(false);
    setResponsableForm(emptyContactForm);
  }, []);

  const handleNewResponsable = useCallback(() => {
    setSelectedResponsableId(null);
    setShowResponsableForm(true);
  }, []);

  const handleSelectBillingContact = useCallback((contactId: string) => {
    setBillingContactMode('existing');
    setSelectedBillingContactId(contactId);
    setBillingContactForm(emptyContactForm);
  }, []);

  const handleBillingSameAsResponsable = useCallback(() => {
    setBillingContactMode('same');
    setSelectedBillingContactId(null);
    setBillingContactForm(emptyContactForm);
  }, []);

  const handleNewBillingContact = useCallback(() => {
    setBillingContactMode('new');
    setSelectedBillingContactId(null);
  }, []);

  const handleSelectDeliveryContact = useCallback((contactId: string) => {
    setSelectedDeliveryContactId(contactId);
    setShowDeliveryContactForm(false);
    setDeliveryContactForm(emptyContactForm);
  }, []);

  const handleNewDeliveryContact = useCallback(() => {
    setSelectedDeliveryContactId(null);
    setShowDeliveryContactForm(true);
  }, []);

  return {
    // State
    selectedResponsableId,
    showResponsableForm,
    responsableForm,
    setResponsableForm,
    billingContactMode,
    selectedBillingContactId,
    billingContactForm,
    setBillingContactForm,
    selectedDeliveryContactId,
    showDeliveryContactForm,
    deliveryContactForm,
    setDeliveryContactForm,
    // Resolved
    resolvedResponsable,
    resolvedBillingContact,
    resolvedDeliveryContact,
    // Handlers
    handleSelectResponsable,
    handleNewResponsable,
    handleSelectBillingContact,
    handleBillingSameAsResponsable,
    handleNewBillingContact,
    handleSelectDeliveryContact,
    handleNewDeliveryContact,
  };
}
