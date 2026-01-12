'use client';

/**
 * Page Contact
 *
 * Formulaire de contact pour la sélection
 *
 * @module ContactPage
 * @since 2026-01-12
 */

import { ContactForm } from '@/components/public-selection';
import { usePublicSelection } from '@/contexts/PublicSelectionContext';

export default function ContactPage() {
  const { selection, branding } = usePublicSelection();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <ContactForm
        selectionId={selection?.id ?? ''}
        selectionName={selection?.name ?? ''}
        branding={branding}
      />
    </div>
  );
}
