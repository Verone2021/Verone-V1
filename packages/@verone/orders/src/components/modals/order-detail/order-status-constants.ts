export const orderStatusLabels: Record<string, string> = {
  pending_approval: "En attente d'approbation",
  draft: 'Brouillon',
  validated: 'Validée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  closed: 'Clôturée',
  cancelled: 'Annulée',
};

export const orderStatusColors: Record<string, string> = {
  pending_approval: 'bg-orange-100 text-orange-800',
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  validated: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-800',
  cancelled: 'bg-red-100 text-red-800',
};
