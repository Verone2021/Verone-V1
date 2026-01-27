'use client';

/**
 * OrganisationCard
 *
 * Carte compacte affichant une organisation avec :
 * - Nom, adresse de livraison (2 lignes)
 * - CA et commissions totales (compact)
 * - Boutons CRUD : Voir, Modifier, Archiver (icônes)
 * - Badges cliquables pour les champs manquants (quick edit)
 *
 * Mode "incomplete" : variante pour les organisations nécessitant
 * une action (ownership_type manquant), avec boutons inline.
 *
 * @module OrganisationCard
 * @since 2026-01-10
 * @updated 2026-01-12 - Ajout mode incomplete avec completion inline
 * @updated 2026-01-12 - Ajout badges cliquables pour quick edit
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganisationLogo } from '@verone/organisations/components/display/OrganisationLogo';
import { Card } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  MapPin,
  Euro,
  Coins,
  Eye,
  Pencil,
  Archive,
  AlertCircle,
  Loader2,
  Building2,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

import type { EnseigneOrganisation } from '../../lib/hooks/use-enseigne-organisations';
import type { OrganisationStats } from '../../lib/hooks/use-organisation-stats';

// =====================================================================
// TYPES
// =====================================================================

interface OrganisationCardProps {
  organisation: EnseigneOrganisation;
  stats?: OrganisationStats;
  onView: (org: EnseigneOrganisation) => void;
  onEdit: (org: EnseigneOrganisation) => void;
  onArchive: (org: EnseigneOrganisation) => void;
  isLoading?: boolean;
  /** Mode d'affichage: normal ou incomplete (avec completion inline) */
  mode?: 'normal' | 'incomplete';
  /** Quick edit: ouvre le modal d'édition d'adresse de livraison */
  onEditShippingAddress?: (org: EnseigneOrganisation) => void;
  /** Quick edit: ouvre le modal d'édition du type de propriété */
  onEditOwnershipType?: (org: EnseigneOrganisation) => void;
}

interface AddressLines {
  line1: string | null;
  line2: string | null;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getOwnershipBadge(
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

function getAddressLines(org: EnseigneOrganisation): AddressLines {
  // Priorité à l'adresse de livraison
  if (org.shipping_address_line1 || org.shipping_city) {
    return {
      line1: org.shipping_address_line1 || null,
      line2:
        [org.shipping_postal_code, org.shipping_city]
          .filter(Boolean)
          .join(' ') || null,
    };
  }
  // Sinon adresse principale
  if (org.city) {
    return {
      line1: null,
      line2: [org.postal_code, org.city].filter(Boolean).join(' ') || null,
    };
  }
  return { line1: null, line2: null };
}

// =====================================================================
// COMPONENT
// =====================================================================

export function OrganisationCard({
  organisation,
  stats,
  onView,
  onEdit,
  onArchive,
  isLoading = false,
  mode = 'normal',
  onEditShippingAddress,
  onEditOwnershipType,
}: OrganisationCardProps) {
  const queryClient = useQueryClient();
  const displayName = organisation.trade_name || organisation.legal_name;
  const address = getAddressLines(organisation);
  const hasAddress = address.line1 || address.line2;
  const ownershipBadge = getOwnershipBadge(organisation.ownership_type);

  // Détection des champs manquants pour les badges cliquables
  const missingShippingAddress = !organisation.shipping_address_line1;
  const missingOwnershipType = !organisation.ownership_type;

  const totalCA = stats?.totalRevenueHT ?? 0;
  const totalCommissions = stats?.totalCommissionsHT ?? 0;

  // Mutation pour mise à jour rapide du ownership_type
  const updateOwnershipMutation = useMutation({
    mutationFn: async (ownershipType: 'succursale' | 'franchise') => {
      const supabase = createClient();
      const { error } = await supabase
        .from('organisations')
        .update({ ownership_type: ownershipType })
        .eq('id', organisation.id);

      if (error) throw error;
      return ownershipType;
    },
    onSuccess: async ownershipType => {
      await queryClient.invalidateQueries({
        queryKey: ['enseigne-organisations'],
      });
      toast.success(
        `Type défini : ${ownershipType === 'succursale' ? 'Restaurant propre' : 'Franchise'}`
      );
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Mode incomplete : carte avec actions de completion inline
  if (mode === 'incomplete' && !organisation.ownership_type) {
    return (
      <Card className="p-4 border-orange-200 bg-orange-50/30">
        {/* Header avec icône warning et nom */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-orange-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {displayName}
            </h3>
            {hasAddress && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {address.line2 || address.line1}
              </p>
            )}
          </div>
        </div>

        {/* Action: Définir le type de propriété */}
        <div className="p-3 bg-white rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600 mb-2">Type de propriété</p>
          <div className="flex gap-2">
            <button
              onClick={() => updateOwnershipMutation.mutate('succursale')}
              disabled={updateOwnershipMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {updateOwnershipMutation.isPending &&
              updateOwnershipMutation.variables === 'succursale' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Propre
            </button>
            <button
              onClick={() => updateOwnershipMutation.mutate('franchise')}
              disabled={updateOwnershipMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {updateOwnershipMutation.isPending &&
              updateOwnershipMutation.variables === 'franchise' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Franchise
            </button>
          </div>
        </div>

        {/* Actions secondaires */}
        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-orange-100">
          <button
            onClick={() => onView(organisation)}
            disabled={isLoading}
            className="p-1.5 text-gray-500 hover:text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded transition-colors"
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(organisation)}
            disabled={isLoading}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </Card>
    );
  }

  // Mode normal : carte standard
  return (
    <Card variant="interactive" className="p-3 flex flex-col h-full">
      {/* Header avec logo, nom et adresse */}
      <div className="flex items-start gap-2.5 mb-2">
        <OrganisationLogo
          logoUrl={organisation.logo_url}
          organisationName={displayName}
          size="sm"
          fallback="icon"
          className="flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {displayName}
            </h3>
            {ownershipBadge && (
              <span
                className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${ownershipBadge.className}`}
              >
                {ownershipBadge.label}
              </span>
            )}
          </div>
          {/* Adresse sur 2 lignes */}
          {hasAddress && (
            <div className="flex items-start gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400 mt-0.5" />
              <div className="text-xs text-gray-500 leading-tight">
                {address.line1 && <div>{address.line1}</div>}
                {address.line2 && <div>{address.line2}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badges cliquables pour les champs manquants */}
      {(missingShippingAddress || missingOwnershipType) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {missingShippingAddress && onEditShippingAddress && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onEditShippingAddress(organisation);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
              title="Ajouter l'adresse de livraison"
            >
              <Truck className="h-3 w-3" />
              Adresse ?
            </button>
          )}
          {missingOwnershipType && onEditOwnershipType && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onEditOwnershipType(organisation);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              title="Définir le type de propriété"
            >
              <Building2 className="h-3 w-3" />
              Type ?
            </button>
          )}
        </div>
      )}

      {/* Stats CA et Commissions - Compact */}
      <div className="flex items-center gap-3 mt-auto mb-2 text-xs">
        <div className="flex items-center gap-1">
          <Euro className="h-3 w-3 text-gray-400" />
          <span className="text-gray-500">CA</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(totalCA)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Coins className="h-3 w-3 text-green-500" />
          <span className="text-green-600">Com.</span>
          <span className="font-semibold text-green-700">
            {formatCurrency(totalCommissions)}
          </span>
        </div>
      </div>

      {/* Actions CRUD - Icônes compactes */}
      <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-gray-100">
        <button
          onClick={() => onView(organisation)}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded transition-colors disabled:opacity-50"
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(organisation)}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
          title="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onArchive(organisation)}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors disabled:opacity-50"
          title="Archiver"
        >
          <Archive className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

export default OrganisationCard;
