'use client';

/**
 * Wrapper pour ContactFormModal - Adapte l'interface customer/modal au format attendu par organisation-contacts-manager
 */

import { ContactFormModal as CustomerContactFormModal } from '@verone/customers/components/modals/contact-form-modal';

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
  is_commercial_contact: boolean;
  is_active: boolean;
}

interface ContactFormModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  organisationId: string;
  contact?: Contact | null;
  onSuccess: () => void;
}

/**
 * Wrapper pour adapter ContactFormModal au format attendu
 *
 * Le modal original attend onSave + organisationName,
 * ce wrapper convertit onSuccess vers onSave et fournit organisationName
 */
export function ContactFormModalWrapper({
  isOpen,
  onClose,
  organisationId,
  contact,
  onSuccess,
}: ContactFormModalWrapperProps) {
  const handleSave = async (contactData: any) => {
    // TODO: Implémenter save logic ici ou dans le modal
    // Pour l'instant on appelle juste onSuccess
    onSuccess();
  };

  return (
    <CustomerContactFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      contact={contact as any}
      organisationId={organisationId}
      organisationName="Organisation" // TODO: Récupérer nom réel
    />
  );
}
