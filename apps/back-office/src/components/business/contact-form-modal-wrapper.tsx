'use client';

/**
 * Wrapper pour ContactFormModal - Adapte l'interface customer/modal au format attendu par organisation-contacts-manager
 */

import { ContactFormModal as CustomerContactFormModal } from '@verone/customers/components/modals/contact-form-modal';
import type { Contact } from '@verone/customers/hooks';

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
  const handleSave = async (_contactData: unknown) => {
    // TODO: Implémenter save logic ici ou dans le modal
    // Pour l'instant on appelle juste onSuccess
    onSuccess();
  };

  return (
    <CustomerContactFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={contactData => {
        void handleSave(contactData).catch(error => {
          console.error('[ContactFormModalWrapper] handleSave failed:', error);
        });
      }}
      contact={contact}
      organisationId={organisationId}
      organisationName="Organisation" // TODO: Récupérer nom réel
    />
  );
}
