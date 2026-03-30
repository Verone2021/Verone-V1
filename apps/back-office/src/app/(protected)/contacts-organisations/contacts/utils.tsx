import { Building, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import type { Contact } from './types';

export function getContactRoles(contact: Contact): string {
  const roles: string[] = [];
  if (contact.is_primary_contact) roles.push('Principal');
  if (contact.is_commercial_contact) roles.push('Commercial');
  if (contact.is_billing_contact) roles.push('Facturation');
  if (contact.is_technical_contact) roles.push('Technique');
  return roles.join(', ') || 'Aucun rôle';
}

export interface OrgTypeInfo {
  icon: ReactNode;
  label: string;
  color: string;
}

export function getOrganisationTypeInfo(type: string): OrgTypeInfo {
  switch (type) {
    case 'supplier':
      return {
        icon: <Building className="h-4 w-4" />,
        label: 'Fournisseur',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'customer':
      return {
        icon: <Users className="h-4 w-4" />,
        label: 'Client Pro',
        color: 'bg-green-50 text-green-700 border-green-200',
      };
    default:
      return {
        icon: <Building className="h-4 w-4" />,
        label: 'Organisation',
        color: 'bg-gray-50 text-gray-700 border-gray-200',
      };
  }
}
