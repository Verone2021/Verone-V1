'use client';

import { Badge } from '@verone/ui';
import { type Organisation } from '@verone/organisations';

// Composant pour afficher les badges de champs manquants
export const MissingFieldsBadges = ({
  customer,
}: {
  customer: Organisation;
}) => {
  const missing: string[] = [];
  if (
    !customer.billing_address_line1 ||
    !customer.billing_postal_code ||
    !customer.billing_city
  ) {
    missing.push('Adresse');
  }
  if (!customer.ownership_type) {
    missing.push('Type');
  }
  if (customer.ownership_type === 'franchise' && !customer.siren) {
    missing.push('SIREN');
  }

  if (missing.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {missing.map(field => (
        <Badge
          key={field}
          variant="outline"
          className="text-xs text-orange-600 border-orange-300 bg-orange-50"
        >
          {field} manquant
        </Badge>
      ))}
    </div>
  );
};

// Helper pour obtenir le badge ownership_type (design LinkMe)
export function getOwnershipBadge(
  type: string | null
): { label: string; className: string } | null {
  switch (type) {
    case 'succursale':
      return { label: 'Propre', className: 'bg-blue-100 text-blue-700' };
    case 'franchise':
      return { label: 'Franchise', className: 'bg-amber-100 text-amber-700' };
    default:
      return null;
  }
}
