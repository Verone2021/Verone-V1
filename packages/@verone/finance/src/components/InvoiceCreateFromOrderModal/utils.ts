/**
 * Normalize country name to ISO 3166-1 alpha-2 code.
 * Handles common French text values from org data vs ISO codes from order JSONB.
 */
export function normalizeCountryCode(
  country: string | null | undefined
): string {
  if (!country) return 'FR';
  const upper = country.trim().toUpperCase();
  // Already ISO code (2 chars)
  if (upper.length === 2) return upper;
  // Common French names → ISO codes
  const mapping: Record<string, string> = {
    FRANCE: 'FR',
    BELGIQUE: 'BE',
    SUISSE: 'CH',
    LUXEMBOURG: 'LU',
    ALLEMAGNE: 'DE',
    ITALIE: 'IT',
    ESPAGNE: 'ES',
    'PAYS-BAS': 'NL',
    PORTUGAL: 'PT',
    'ROYAUME-UNI': 'GB',
    MONACO: 'MC',
  };
  return mapping[upper] || 'FR';
}

export function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}
