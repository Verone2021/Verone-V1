'use client';

/**
 * Page de redirection dynamique pour les organisations
 * Redirige vers la bonne route en fonction du type d'organisation
 */

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useOrganisation } from '@verone/organisations';
import { Card, CardContent } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';

export default function OrganisationRedirectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(true);

  const { organisation, loading, error } = useOrganisation(id as string);

  useEffect(() => {
    if (loading) return;

    if (organisation) {
      // Rediriger vers la bonne route en fonction du type
      let targetRoute = '/contacts-organisations';

      switch (organisation.type) {
        case 'supplier':
          targetRoute = `/contacts-organisations/suppliers/${organisation.id}`;
          break;
        case 'partner':
          targetRoute = `/contacts-organisations/partners/${organisation.id}`;
          break;
        case 'customer':
          targetRoute = `/contacts-organisations/customers/${organisation.id}`;
          break;
        default:
          // Par défaut, essayer suppliers (cas le plus fréquent pour les dépenses)
          targetRoute = `/contacts-organisations/suppliers/${organisation.id}`;
      }

      router.replace(targetRoute);
    } else if (error) {
      setRedirecting(false);
    }
  }, [organisation, loading, error, router]);

  // État de chargement
  if (loading || redirecting) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-black mb-2">
              Chargement...
            </h3>
            <p className="text-gray-600">
              Redirection vers la fiche organisation en cours...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Organisation non trouvée
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">
            Organisation introuvable
          </h3>
          <p className="text-gray-600 mb-4">
            Cette organisation n&apos;existe pas ou vous n&apos;avez pas les
            droits pour la consulter.
          </p>
          <div className="flex gap-2 justify-center">
            <ButtonV2 asChild>
              <Link href="/contacts-organisations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux organisations
              </Link>
            </ButtonV2>
            <ButtonV2 variant="outline" asChild>
              <Link href="/finance/depenses">Retour aux dépenses</Link>
            </ButtonV2>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
