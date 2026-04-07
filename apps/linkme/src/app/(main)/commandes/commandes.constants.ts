export const STATUS_LABELS: Record<string, string> = {
  draft: 'En attente de validation',
  validated: 'Validée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  partially_shipped: 'Expédition partielle',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-amber-100', text: 'text-amber-700' },
  validated: { bg: 'bg-blue-100', text: 'text-blue-700' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-700' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
  partially_shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
};

export type TabType =
  | 'all'
  | 'pending_approval'
  | 'validated'
  | 'shipped'
  | 'cancelled';

export const ITEMS_PER_PAGE = 20;

export const YEAR_OPTIONS = [
  { value: 'all', label: 'Toutes les années' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
];

export const PERIOD_OPTIONS = [
  { value: 'all', label: 'Toute la période' },
  { value: 'q1', label: 'T1 (Jan-Mar)' },
  { value: 'q2', label: 'T2 (Avr-Jun)' },
  { value: 'q3', label: 'T3 (Jul-Sep)' },
  { value: 'q4', label: 'T4 (Oct-Déc)' },
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

export const OWNERSHIP_TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les restaurants' },
  { value: 'succursale', label: 'Propre (succursale)' },
  { value: 'franchise', label: 'Franchise' },
];
