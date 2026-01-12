'use client';

/**
 * Page FAQ
 *
 * Affiche les questions fréquentes sur la sélection
 *
 * @module FAQPage
 * @since 2026-01-12
 */

import { FAQSection } from '@/components/public-selection';
import { usePublicSelection } from '@/contexts/PublicSelectionContext';

export default function FAQPage() {
  const { selection, branding } = usePublicSelection();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <FAQSection
        branding={branding}
        contactInfo={{
          name: selection?.contact_name ?? null,
          email: selection?.contact_email ?? null,
          phone: selection?.contact_phone ?? null,
        }}
        selectionName={selection?.name ?? ''}
      />
    </div>
  );
}
