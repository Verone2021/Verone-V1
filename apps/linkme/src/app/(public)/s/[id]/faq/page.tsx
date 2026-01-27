'use client';

import { FAQSection } from '@/components/public-selection';

import { useSelection } from '../selection-context';

export default function FAQPage() {
  const { selection, branding } = useSelection();

  if (!selection) return null;

  return (
    <div id="faq" className="scroll-mt-20">
      <FAQSection
        branding={branding}
        contactInfo={{
          name: selection.contact_name,
          email: selection.contact_email,
          phone: selection.contact_phone,
        }}
        selectionName={selection.name}
      />
    </div>
  );
}
