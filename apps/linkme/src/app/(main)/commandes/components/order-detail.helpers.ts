'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { StructuredAddress } from '../../../../hooks/use-linkme-orders';

// Couleurs des badges par statut
export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  validated: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  validated: 'Validee',
  processing: 'En cours',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
};

export function formatAddress(address: StructuredAddress | null): string[] {
  if (!address || Object.keys(address).length === 0) {
    return ['Non renseignee'];
  }

  const lines: string[] = [];
  if (address.contact_name) lines.push(address.contact_name);
  // Support both key formats: line1 (frontend) and address_line1 (DB JSONB)
  const line1 = address.line1 ?? address.address_line1;
  const line2 = address.line2 ?? address.address_line2;
  if (line1) lines.push(line1);
  if (line2) lines.push(line2);
  if (address.postal_code ?? address.city) {
    lines.push([address.postal_code, address.city].filter(Boolean).join(' '));
  }
  if (address.country) lines.push(address.country);

  return lines.length > 0 ? lines : ['Non renseignee'];
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}
