'use client';

/**
 * Composant réutilisable : Card Statistiques Organisation
 * Affichage conditionnel selon type (supplier/customer/provider)
 */

import { Package, TrendingUp, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import type { Organisation } from '@verone/organisations/hooks';

interface OrganisationStatsCardProps {
  organisation: Organisation;
  organisationType: 'supplier' | 'customer' | 'provider';
  className?: string;
}

export function OrganisationStatsCard({
  organisation,
  organisationType,
  className,
}: OrganisationStatsCardProps) {
  // Format date unifié
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Statistiques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Produits référencés (fournisseurs uniquement) */}
        {organisationType === 'supplier' && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produits référencés:
            </span>
            <span className="text-2xl font-bold text-black">
              {organisation._count?.products || 0}
            </span>
          </div>
        )}

        {/* Informations générales */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Créé le:
            </span>
            <span>{formatDate(organisation.created_at)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Modifié le:
            </span>
            <span>{formatDate(organisation.updated_at)}</span>
          </div>

          {/* Segment (fournisseurs) */}
          {organisationType === 'supplier' && organisation.supplier_segment && (
            <div className="flex justify-between">
              <span>Segment:</span>
              <span className="font-medium">
                {organisation.supplier_segment}
              </span>
            </div>
          )}

          {/* Secteur d'activité */}
          {organisation.industry_sector && (
            <div className="flex justify-between">
              <span>Secteur:</span>
              <span className="font-medium">
                {organisation.industry_sector}
              </span>
            </div>
          )}

          {/* Pays */}
          {organisation.country && (
            <div className="flex justify-between">
              <span>Pays:</span>
              <span className="font-medium">{organisation.country}</span>
            </div>
          )}
        </div>

        {/* Information archivage */}
        {organisation.archived_at && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Archivé le:</span>
              <span className="text-red-600 font-medium">
                {formatDate(organisation.archived_at)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
