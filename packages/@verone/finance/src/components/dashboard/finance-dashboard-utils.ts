export const ALL_YEARS_VALUE = 0;

export interface FinanceFilters {
  year: number;
  months: number[];
}

export const MONTHS = [
  { value: 1, label: 'Janv.', fullLabel: 'Janvier' },
  { value: 2, label: 'Fevr.', fullLabel: 'Fevrier' },
  { value: 3, label: 'Mars', fullLabel: 'Mars' },
  { value: 4, label: 'Avr.', fullLabel: 'Avril' },
  { value: 5, label: 'Mai', fullLabel: 'Mai' },
  { value: 6, label: 'Juin', fullLabel: 'Juin' },
  { value: 7, label: 'Juil.', fullLabel: 'Juillet' },
  { value: 8, label: 'Aout', fullLabel: 'Aout' },
  { value: 9, label: 'Sept.', fullLabel: 'Septembre' },
  { value: 10, label: 'Oct.', fullLabel: 'Octobre' },
  { value: 11, label: 'Nov.', fullLabel: 'Novembre' },
  { value: 12, label: 'Dec.', fullLabel: 'Decembre' },
];

export const AVAILABLE_YEARS = Array.from(
  { length: new Date().getFullYear() - 2022 },
  (_, i) => new Date().getFullYear() - i
);

export function getDateRangeForFilters(filters: FinanceFilters): {
  startDate: Date | null;
  endDate: Date | null;
} {
  if (filters.year === ALL_YEARS_VALUE) {
    return { startDate: null, endDate: null };
  }
  const year = filters.year;
  const months = filters.months;
  if (months.length === 0) {
    return {
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59),
    };
  }
  const sortedMonths = [...months].sort((a, b) => a - b);
  const firstMonth = sortedMonths[0];
  const lastMonth = sortedMonths[sortedMonths.length - 1];
  const lastDay = new Date(year, lastMonth, 0).getDate();
  return {
    startDate: new Date(year, firstMonth - 1, 1),
    endDate: new Date(year, lastMonth - 1, lastDay, 23, 59, 59),
  };
}

export function formatFiltersLabel(filters: FinanceFilters): string {
  if (filters.year === ALL_YEARS_VALUE) return 'Toutes les donnees';
  if (filters.months.length === 0) return `Annee ${filters.year}`;
  if (filters.months.length === 1) {
    const month = MONTHS.find(m => m.value === filters.months[0]);
    return `${month?.fullLabel} ${filters.year}`;
  }
  if (filters.months.length === 12) return `Annee ${filters.year}`;
  const sortedMonths = [...filters.months].sort((a, b) => a - b);
  const monthLabels = sortedMonths.map(
    m => MONTHS.find(mo => mo.value === m)?.label
  );
  return `${monthLabels.join(', ')} ${filters.year}`;
}

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const DONUT_COLORS = [
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#6366f1',
  '#8b5cf6',
  '#64748b',
];
