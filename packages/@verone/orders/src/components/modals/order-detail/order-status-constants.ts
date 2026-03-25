export const orderStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Valid\u00e9e',
  partially_shipped: 'Partiellement exp\u00e9di\u00e9e',
  shipped: 'Exp\u00e9di\u00e9e',
  cancelled: 'Annul\u00e9e',
};

export const orderStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
