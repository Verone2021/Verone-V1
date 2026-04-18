'use client';

import { cn } from '@verone/utils';
import { Phone } from 'lucide-react';

interface NamePhoneSectionProps {
  firstName: string;
  lastName: string;
  phone: string;
  errors: Record<string, string>;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}

export function NamePhoneSection({
  firstName,
  lastName,
  phone,
  errors,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
}: NamePhoneSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prenom *
          </label>
          <input
            type="text"
            value={firstName}
            onChange={e => onFirstNameChange(e.target.value)}
            placeholder="Jean"
            className={cn(
              'w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
              errors.firstName
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            )}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            type="text"
            value={lastName}
            onChange={e => onLastNameChange(e.target.value)}
            placeholder="Dupont"
            className={cn(
              'w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
              errors.lastName
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            )}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telephone
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="tel"
            value={phone}
            onChange={e => onPhoneChange(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  );
}
