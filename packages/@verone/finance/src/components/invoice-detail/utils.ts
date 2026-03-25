import type { AddressData } from './types';

export function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatAddress(address: AddressData | null): string {
  if (!address) return 'Adresse non renseignee';
  const parts = [
    address.street,
    `${address.postal_code ?? ''} ${address.city ?? ''}`.trim(),
    address.country,
  ].filter(Boolean);
  return parts.join(', ') ?? 'Adresse non renseignee';
}

export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
