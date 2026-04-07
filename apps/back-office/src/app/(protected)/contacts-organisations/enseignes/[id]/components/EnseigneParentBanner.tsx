'use client';

import { Card, CardContent } from '@verone/ui';
import { Building2, MapPin } from 'lucide-react';

interface ParentOrganisation {
  trade_name?: string | null;
  legal_name?: string | null;
  siret?: string | null;
  siren?: string | null;
  billing_address_line1?: string | null;
  billing_postal_code?: string | null;
  billing_city?: string | null;
}

interface EnseigneParentBannerProps {
  parentOrganisation: ParentOrganisation | null | undefined;
}

export function EnseigneParentBanner({
  parentOrganisation,
}: EnseigneParentBannerProps) {
  if (!parentOrganisation) return null;

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-900">
              {parentOrganisation.trade_name ?? parentOrganisation.legal_name}
            </span>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
              Siege
            </span>
          </div>
          {(parentOrganisation.siret ?? parentOrganisation.siren) && (
            <div className="text-sm text-amber-800">
              <span className="font-medium">
                {parentOrganisation.siret ? 'SIRET' : 'SIREN'}:
              </span>{' '}
              {parentOrganisation.siret ?? parentOrganisation.siren}
            </div>
          )}
          {(parentOrganisation.billing_address_line1 ??
            parentOrganisation.billing_postal_code ??
            parentOrganisation.billing_city) && (
            <div className="flex items-center gap-1.5 text-sm text-amber-800">
              <MapPin className="h-3.5 w-3.5" />
              {[
                parentOrganisation.billing_address_line1,
                parentOrganisation.billing_postal_code,
                parentOrganisation.billing_city,
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
