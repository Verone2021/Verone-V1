'use client';

/**
 * EnseigneOrganisationsTable - Tableau des organisations membres
 *
 * Affiche :
 * - Liste des organisations avec nom, ville, CA, statut
 * - Société mère mise en avant
 * - Actions: voir détail, supprimer
 *
 * @module EnseigneOrganisationsTable
 */

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Building2,
  Eye,
  Star,
  X,
  Plus,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

import type { OrganisationWithRevenue } from '../../hooks/use-enseigne-stats';

interface EnseigneOrganisationsTableProps {
  organisations: OrganisationWithRevenue[];
  parentOrganisation: OrganisationWithRevenue | null;
  onAddOrganisations?: () => void;
  onRemoveOrganisation?: (organisationId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
  /** ID de l'enseigne pour le lien de retour (optionnel) */
  enseigneId?: string;
  /** URL de retour personnalisée (optionnel) */
  returnUrl?: string;
}

/**
 * Formater un montant en euros
 */
function formatCurrency(value: number): string {
  return value.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Skeleton pour loading
 */
function TableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="w-48 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-9 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4 py-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Tableau des organisations membres
 */
export function EnseigneOrganisationsTable({
  organisations,
  parentOrganisation,
  onAddOrganisations,
  onRemoveOrganisation,
  loading = false,
  className,
  enseigneId,
  returnUrl,
}: EnseigneOrganisationsTableProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (loading) {
    return <TableSkeleton />;
  }

  // Trier: société mère en premier, puis par CA décroissant
  const sortedOrganisations = [...organisations].sort((a, b) => {
    if (a.is_enseigne_parent && !b.is_enseigne_parent) return -1;
    if (!a.is_enseigne_parent && b.is_enseigne_parent) return 1;
    return b.revenue - a.revenue;
  });

  const handleRemove = async (orgId: string) => {
    if (!onRemoveOrganisation) return;
    setRemovingId(orgId);
    try {
      await onRemoveOrganisation(orgId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewOrganisation = (orgId: string) => {
    // Construire l'URL de retour si fournie ou si enseigneId est disponible
    const effectiveReturnUrl =
      returnUrl ||
      (enseigneId ? `/canaux-vente/linkme/enseignes/${enseigneId}` : null);

    if (effectiveReturnUrl) {
      const encodedReturnUrl = encodeURIComponent(effectiveReturnUrl);
      router.push(
        `/contacts-organisations/customers/${orgId}?returnUrl=${encodedReturnUrl}`
      );
    } else {
      router.push(`/contacts-organisations/customers/${orgId}`);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <Building2 className="h-5 w-5 mr-2 text-gray-500" />
            Organisations membres ({organisations.length})
          </CardTitle>
          {onAddOrganisations && (
            <ButtonV2 variant="outline" size="sm" onClick={onAddOrganisations}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </ButtonV2>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sortedOrganisations.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Aucune organisation dans cette enseigne
            </p>
            {onAddOrganisations && (
              <ButtonV2
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onAddOrganisations}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des organisations
              </ButtonV2>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Organisation</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead className="text-right">CA</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrganisations.map(org => {
                const displayName = org.trade_name || org.legal_name;
                const isParent = org.is_enseigne_parent;

                return (
                  <TableRow
                    key={org.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isParent && 'bg-amber-50/50',
                      'hover:bg-gray-50'
                    )}
                    onClick={() => handleViewOrganisation(org.id)}
                  >
                    {/* Nom */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                            isParent ? 'bg-amber-100' : 'bg-gray-100'
                          )}
                        >
                          {isParent ? (
                            <Star className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Building2 className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {displayName}
                            </p>
                            {isParent && (
                              <Badge
                                variant="warning"
                                className="text-xs flex-shrink-0"
                              >
                                Mère
                              </Badge>
                            )}
                          </div>
                          {org.trade_name &&
                            org.legal_name !== org.trade_name && (
                              <p className="text-xs text-gray-500 truncate">
                                {org.legal_name}
                              </p>
                            )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Ville */}
                    <TableCell>
                      {org.city ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          {org.city}
                          {org.country && (
                            <span className="text-gray-400 ml-1">
                              ({org.country})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>

                    {/* CA */}
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          org.revenue > 0 ? 'text-green-600' : 'text-gray-400'
                        )}
                      >
                        {org.revenue > 0 ? formatCurrency(org.revenue) : '—'}
                      </span>
                    </TableCell>

                    {/* Statut */}
                    <TableCell className="text-center">
                      {org.is_active ? (
                        <Badge
                          variant="success"
                          className="inline-flex items-center"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="inline-flex items-center"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end space-x-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrganisation(org.id)}
                          title="Voir détail"
                        >
                          <Eye className="h-4 w-4" />
                        </ButtonV2>
                        {onRemoveOrganisation && (
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(org.id)}
                            disabled={removingId === org.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Retirer de l'enseigne"
                          >
                            {removingId === org.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </ButtonV2>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
