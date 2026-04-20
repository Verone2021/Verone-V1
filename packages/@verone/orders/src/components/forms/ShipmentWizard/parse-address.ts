/**
 * Tolerant parser for jsonb shipping_address columns.
 *
 * PostgREST returns jsonb as parsed JS objects, except when historical rows
 * were double-encoded (stored as JSON strings inside the jsonb column). The
 * 2026-05-01 migration restored corrupted rows, but this parser keeps the UI
 * defensive against any future regression or legacy dump.
 *
 * Accepts string or object, returns an object or null.
 */
export function parseShippingAddress(
  raw: unknown
): Record<string, string> | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as Record<string, string>;
  return null;
}

/**
 * Extract postal code from a shipping_address with key fallbacks.
 * Tolerates both `postal_code` (DB canonical) and legacy `zip`.
 */
export function extractPostalCode(addr: Record<string, string> | null): string {
  if (!addr) return '';
  return addr.postal_code ?? addr.zip ?? '';
}

/**
 * Build a human-readable address line from a parsed shipping_address.
 * Tolerates both `address_line1` (DB canonical) and legacy `line1`.
 */
export function formatAddressLine(addr: Record<string, string> | null): string {
  if (!addr) return '';
  const line = addr.address_line1 ?? addr.line1 ?? '';
  const zip = addr.postal_code ?? addr.zip ?? '';
  const city = addr.city ?? '';
  return [line, [zip, city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}
