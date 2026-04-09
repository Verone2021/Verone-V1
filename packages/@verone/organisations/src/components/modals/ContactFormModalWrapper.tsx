'use client';

/**
 * Wrapper pour ContactFormModal — sauvegarde reelle via useContacts().createContact
 */

import { ContactFormModal as CustomerContactFormModal } from '@verone/customers/components/modals/contact-form-modal';

import {
  useContacts,
  useOrganisation,
  getOrganisationDisplayName,
} from '../../hooks';

interface Contact {
  id: string;
  organisation_id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  department: string | null;
  email: string;
  phone: string | null;
  mobile: string | null;
  is_primary_contact: boolean;
  is_billing_contact: boolean;
  is_technical_contact: boolean;
  is_active: boolean;
}

interface ContactFormData {
  first_name: string;
  last_name: string;
  title?: string;
  department?: string;
  email: string;
  phone?: string;
  mobile?: string;
  secondary_email?: string;
  direct_line?: string;
  is_primary_contact: boolean;
  is_billing_contact: boolean;
  is_technical_contact: boolean;
  preferred_communication_method: 'email' | 'phone' | 'both';
  accepts_marketing: boolean;
  accepts_notifications: boolean;
  language_preference: string;
  notes?: string;
}

interface ContactFormModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  organisationId: string;
  contact?: Contact | null;
  onSuccess: () => void;
}

export function ContactFormModalWrapper({
  isOpen,
  onClose,
  organisationId,
  contact,
  onSuccess,
}: ContactFormModalWrapperProps) {
  const { createContact } = useContacts();
  const { organisation } = useOrganisation(organisationId);

  const orgName = organisation
    ? getOrganisationDisplayName(organisation)
    : 'Organisation';

  const handleSave = async (contactData: ContactFormData) => {
    await createContact({
      organisation_id: organisationId,
      first_name: contactData.first_name,
      last_name: contactData.last_name,
      email: contactData.email,
      title: contactData.title,
      department: contactData.department,
      phone: contactData.phone,
      mobile: contactData.mobile,
      secondary_email: contactData.secondary_email,
      direct_line: contactData.direct_line,
      is_primary_contact: contactData.is_primary_contact,
      is_billing_contact: contactData.is_billing_contact,
      is_technical_contact: contactData.is_technical_contact,
      preferred_communication_method:
        contactData.preferred_communication_method,
      accepts_marketing: contactData.accepts_marketing,
      accepts_notifications: contactData.accepts_notifications,
      language_preference: contactData.language_preference,
      notes: contactData.notes,
    });
    onSuccess();
  };

  return (
    <CustomerContactFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={(data: unknown) =>
        void handleSave(data as ContactFormData).catch((error: unknown) => {
          console.error('[ContactFormModalWrapper] Save failed:', error);
        })
      }
      contact={
        contact as unknown as Parameters<
          typeof CustomerContactFormModal
        >[0]['contact']
      }
      organisationId={organisationId}
      organisationName={orgName}
    />
  );
}
