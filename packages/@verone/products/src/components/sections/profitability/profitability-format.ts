/** Helpers de formatage partagés entre les composants de rentabilité */

export const fmtEur = (v: number | null | undefined): string => {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

const oneDecimalFr = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const twoDecimalsFr = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtPct = (v: number | null | undefined): string => {
  if (v == null) return '—';
  return `${oneDecimalFr.format(v)} %`;
};

export const fmtQty = (v: number): string =>
  new Intl.NumberFormat('fr-FR').format(v);

export const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const fmtCoef = (v: number | null | undefined): string => {
  if (v == null) return '—';
  return `×${twoDecimalsFr.format(v)}`;
};

export const clrMargin = (v: number | null | undefined): string =>
  v == null ? '' : v >= 0 ? 'text-green-600' : 'text-red-600';
