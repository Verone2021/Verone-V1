'use client';

import type { ContactsStepData } from '../../components/orders/schemas/order-form.schema';

/** Convert empty string to null for DB constraints */
export function toNullIfEmpty(v: string | null | undefined): string | null {
  if (!v) return null;
  return v;
}

/** Convert empty/blank string to null */
export function emptyToNull(v: string | null | undefined): string | null {
  if (!v || v.trim().length === 0) return null;
  return v.trim();
}

/**
 * Détermine le taux TVA selon le code pays
 * - France (FR) = 20%
 * - Autres pays (export) = 0%
 */
export function getTaxRateFromCountry(
  countryCode: string | undefined | null
): number {
  return countryCode === 'FR' || !countryCode ? 0.2 : 0.0;
}

/**
 * Deep merge pour updateContacts — applique uniquement les champs définis dans `data`.
 */
export function mergeContacts(
  prev: ContactsStepData,
  data: Partial<ContactsStepData>
): ContactsStepData {
  const next = { ...prev };
  if (data.responsable !== undefined) next.responsable = data.responsable;
  if (data.existingResponsableId !== undefined)
    next.existingResponsableId = data.existingResponsableId;
  if (data.franchiseInfo !== undefined) next.franchiseInfo = data.franchiseInfo;
  if (data.billing !== undefined)
    next.billing = { ...prev.billing, ...data.billing };
  if (data.billingContact !== undefined)
    next.billingContact = { ...prev.billingContact, ...data.billingContact };
  if (data.billingAddress !== undefined)
    next.billingAddress = { ...prev.billingAddress, ...data.billingAddress };
  if (data.billingOrg !== undefined)
    next.billingOrg = { ...prev.billingOrg, ...data.billingOrg };
  if (data.delivery !== undefined)
    next.delivery = { ...prev.delivery, ...data.delivery };
  return next;
}
