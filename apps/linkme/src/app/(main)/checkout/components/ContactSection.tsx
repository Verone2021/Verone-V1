import { User } from 'lucide-react';

import type { CheckoutFormData } from '../types';

interface ContactSectionProps {
  formData: CheckoutFormData;
  updateFormData: (
    field: keyof CheckoutFormData,
    value: string | boolean
  ) => void;
}

export function ContactSection({
  formData,
  updateFormData,
}: ContactSectionProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <User className="h-4 w-4" />
        Informations de contact
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => updateFormData('email', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="votre@email.com"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Téléphone *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={e => updateFormData('phone', e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+33 6 12 34 56 78"
          />
        </div>
      </div>
    </div>
  );
}
