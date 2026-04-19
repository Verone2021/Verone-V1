'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Building, MapPin } from 'lucide-react';

export interface IBillingAddressResolved {
  address_line1: string;
  postal_code: string;
  city: string;
  country: string;
}

interface IBillingAddressEditorProps {
  /** Adresse de facturation initiale (depuis la commande/org) */
  initialBillingAddress: IBillingAddressResolved | null;
}

/**
 * Affiche l'adresse de facturation en mode READ-ONLY.
 * L'adresse est celle de l'org commande — pas d'édition possible ici.
 * Pour changer l'org de facturation : utiliser le mode maison mère via le SIRET guard banner.
 */
export function BillingAddressEditor({
  initialBillingAddress,
}: IBillingAddressEditorProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building className="h-4 w-4" />
          Adresse de facturation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {initialBillingAddress ? (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              {initialBillingAddress.address_line1 && (
                <p>{initialBillingAddress.address_line1}</p>
              )}
              <p>
                {[initialBillingAddress.postal_code, initialBillingAddress.city]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Aucune adresse de facturation enregistree
          </p>
        )}
      </CardContent>
    </Card>
  );
}
