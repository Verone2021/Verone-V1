import type { SalesOrder } from '@verone/orders/hooks';

/** Formatted address structure */
export interface FormattedAddress {
  lines: string[];
  cityLine: string;
}

/** Effective address with source information */
export interface EffectiveAddress {
  formatted: FormattedAddress;
  source: 'manual' | 'organisation';
}

/** Format an address from JSONB (handles structured, legacy text, and string formats) */
export function formatOrderAddress(addr: unknown): FormattedAddress | null {
  if (!addr) return null;
  if (typeof addr === 'string') {
    const trimmed = addr.trim();
    if (!trimmed) return null;
    // Try to parse JSON strings (handles double-encoded JSONB)
    if (trimmed.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) {
          return formatOrderAddress(parsed);
        }
      } catch {
        // Not valid JSON, treat as plain text
      }
    }
    return { lines: [trimmed], cityLine: '' };
  }
  if (typeof addr !== 'object') return null;
  const obj = addr as Record<string, string | null | undefined>;

  // Legacy format: single "address" field with newlines
  if (obj.address && typeof obj.address === 'string') {
    const lines = obj.address
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    return lines.length > 0 ? { lines, cityLine: '' } : null;
  }

  // Structured format: address_line1, city, postal_code, etc.
  const streetLines = [obj.address_line1, obj.line1, obj.address_line2]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map(v => v.trim());
  const cityLine = [obj.postal_code, obj.city]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map(v => v.trim())
    .join(' ');
  const country =
    typeof obj.country === 'string' && obj.country.trim()
      ? obj.country.trim()
      : '';

  if (streetLines.length === 0 && !cityLine && !country) return null;

  const fullCityLine = [cityLine, country].filter(Boolean).join(', ');
  return { lines: streetLines, cityLine: fullCityLine };
}

/** Compare two formatted addresses (normalized: trim + lowercase) */
export function isSameFormattedAddress(
  a: FormattedAddress,
  b: FormattedAddress
): boolean {
  const normalize = (s: string) => s.trim().toLowerCase();
  if (a.lines.length !== b.lines.length) return false;
  for (let i = 0; i < a.lines.length; i++) {
    if (normalize(a.lines[i]) !== normalize(b.lines[i])) return false;
  }
  return normalize(a.cityLine) === normalize(b.cityLine);
}

/** Build org address object for billing (billing fields with fallback to main address) */
export function buildOrgBillingAddress(
  org: NonNullable<SalesOrder['organisations']>
) {
  return {
    address_line1: org.billing_address_line1 ?? org.address_line1,
    address_line2: org.billing_address_line2 ?? org.address_line2,
    postal_code: org.billing_postal_code ?? org.postal_code,
    city: org.billing_city ?? org.city,
    country: org.billing_country,
  };
}

/** Build org address object for shipping (main address only, no shipping-specific fields) */
export function buildOrgShippingAddress(
  org: NonNullable<SalesOrder['organisations']>
) {
  return {
    address_line1: org.address_line1,
    address_line2: org.address_line2,
    postal_code: org.postal_code,
    city: org.city,
  };
}

/** Determine the effective address + its source */
export function getEffectiveAddress(
  orderAddr: unknown,
  orgAddr: Record<string, string | null | undefined> | null
): EffectiveAddress | null {
  const fromOrder = formatOrderAddress(orderAddr);
  if (fromOrder) {
    // Compare with org to determine source
    const fromOrg = orgAddr ? formatOrderAddress(orgAddr) : null;
    const isSameAsOrg = fromOrg && isSameFormattedAddress(fromOrder, fromOrg);
    return {
      formatted: fromOrder,
      source: isSameAsOrg ? 'organisation' : 'manual',
    };
  }
  // Fallback to org address
  if (orgAddr) {
    const fromOrg = formatOrderAddress(orgAddr);
    if (fromOrg) return { formatted: fromOrg, source: 'organisation' };
  }
  return null;
}
