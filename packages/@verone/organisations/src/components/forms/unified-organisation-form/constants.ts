// ========================
// CONSTANTS
// ========================

export const _COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'IT', label: 'Italie' },
  { value: 'ES', label: 'Espagne' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'NL', label: 'Pays-Bas' },
  { value: 'PT', label: 'Portugal' },
  { value: 'UK', label: 'Royaume-Uni' },
  { value: 'US', label: 'États-Unis' },
  { value: 'CN', label: 'Chine' },
  { value: 'OTHER', label: 'Autre' },
];

export const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollar US ($)' },
  { value: 'GBP', label: 'Livre Sterling (£)' },
  { value: 'CHF', label: 'Franc Suisse (CHF)' },
];

export const LEGAL_FORMS = [
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SA', label: 'SA' },
  { value: 'EURL', label: 'EURL' },
  { value: 'SCI', label: 'SCI' },
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'AUTRE', label: 'Autre' },
];

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'NET_30', label: 'Net 30 jours' },
  { value: 'NET_45', label: 'Net 45 jours' },
  { value: 'NET_60', label: 'Net 60 jours' },
  { value: 'IMMEDIATE', label: 'Paiement immédiat' },
  { value: 'CUSTOM', label: 'Personnalisé' },
];

export const _SUPPLIER_SEGMENTS = [
  { value: 'STRATEGIC', label: 'Stratégique' },
  { value: 'TACTICAL', label: 'Tactique' },
  { value: 'OPERATIONAL', label: 'Opérationnel' },
  { value: 'COMMODITY', label: 'Commodité' },
];

// VAT rates — aligned with DB trigger trg_calculate_default_vat_rate
// (FR → 0.20, autres pays → 0.00)
export const VAT_RATES = [
  { value: 0, label: 'Exonéré (0 %)' },
  { value: 0.055, label: 'Réduit (5,5 %)' },
  { value: 0.1, label: 'Intermédiaire (10 %)' },
  { value: 0.2, label: 'Normal (20 %)' },
] as const;

export const DEFAULT_VAT_RATE = 0.2;

export function defaultVatRateForCountry(
  country: string | null | undefined
): number {
  if (!country || country === 'FR') return 0.2;
  return 0;
}

export function formatVatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return '—';
  const pct = rate * 100;
  const formatted = Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1);
  return `${formatted.replace('.', ',')} %`;
}
