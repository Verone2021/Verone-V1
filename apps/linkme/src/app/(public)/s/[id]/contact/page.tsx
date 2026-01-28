'use client';

import { ContactForm } from '@/components/public-selection';

import { useSelection } from '../selection-context';

export default function ContactPage() {
  const { selection, branding } = useSelection();

  if (!selection) return null;

  return (
    <div id="contact" className="scroll-mt-20">
      <ContactForm
        selectionId={selection.id}
        selectionName={selection.name}
        branding={branding}
      />
    </div>
  );
}
