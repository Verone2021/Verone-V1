'use client';

import { Input, Label } from '@verone/ui';

import type { ContactBase } from '../../../schemas/order-form.schema';

interface ContactFormProps {
  contact: ContactBase;
  onChange: (field: keyof ContactBase, value: string) => void;
}

export function ContactForm({ contact, onChange }: ContactFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="delivery-firstName">
          Prenom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="delivery-firstName"
          type="text"
          value={contact.firstName}
          onChange={e => onChange('firstName', e.target.value)}
          placeholder="Jean"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-lastName">
          Nom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="delivery-lastName"
          type="text"
          value={contact.lastName}
          onChange={e => onChange('lastName', e.target.value)}
          placeholder="Dupont"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="delivery-email"
          type="email"
          value={contact.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="jean.dupont@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-phone">
          Telephone <span className="text-red-500">*</span>
        </Label>
        <Input
          id="delivery-phone"
          type="tel"
          value={contact.phone ?? ''}
          onChange={e => onChange('phone', e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>
    </div>
  );
}
