'use client';

import Image from 'next/image';

import { ArrowRight, Building2, MapPin, X } from 'lucide-react';

interface MapPopupCardProps {
  organisation: {
    id: string;
    logo_url: string | null;
    trade_name: string | null;
    legal_name: string;
    shipping_address_line1: string | null;
    shipping_postal_code: string | null;
    shipping_city: string | null;
    city: string | null;
    ownership_type?: 'propre' | 'franchise' | 'succursale' | null;
  };
  onViewDetails: (id: string) => void;
  onClose: () => void;
}

function formatAddress(org: MapPopupCardProps['organisation']): {
  line1: string | null;
  line2: string | null;
} {
  const line1 = org.shipping_address_line1;
  const line2 =
    org.shipping_postal_code && org.shipping_city
      ? `${org.shipping_postal_code} ${org.shipping_city}`
      : (org.shipping_city ?? org.city ?? null);
  return { line1, line2 };
}

export function MapPopupCard({
  organisation,
  onViewDetails,
  onClose,
}: MapPopupCardProps): React.JSX.Element {
  const displayName = organisation.trade_name ?? organisation.legal_name;
  const address = formatAddress(organisation);
  const isPropre = organisation.ownership_type === 'propre';

  return (
    <div className="relative max-w-[280px] bg-white rounded-lg shadow-md p-4 space-y-3">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header: Logo + Name */}
      <div className="flex items-center gap-3 pr-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          {organisation.logo_url ? (
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100">
              <Image
                src={organisation.logo_url}
                alt={displayName}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {displayName}
        </h3>
      </div>

      {/* Address */}
      {(Boolean(address.line1) || Boolean(address.line2)) && (
        <div className="flex items-start gap-2 text-gray-600 text-sm">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {address.line1 && <div>{address.line1}</div>}
            {address.line2 && <div>{address.line2}</div>}
          </div>
        </div>
      )}

      {/* Badge */}
      <div>
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
            isPropre
              ? 'bg-blue-100 text-blue-700'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          {isPropre ? 'Restaurant propre' : 'Franchise'}
        </span>
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-1">
        <button
          onClick={() => onViewDetails(organisation.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#5DBEBB] rounded-lg hover:bg-[#4DAEAB] transition-colors"
        >
          Voir plus
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
