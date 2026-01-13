'use client';

/**
 * OrganisationDetailModal
 *
 * Modal de visualisation des détails d'une organisation
 * Affiche toutes les infos, CA et commissions
 *
 * @module OrganisationDetailModal
 * @since 2026-01-10
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { Building2, MapPin, Euro, Coins, Package } from 'lucide-react';

import type { EnseigneOrganisation } from '../../lib/hooks/use-enseigne-organisations';
import type { OrganisationStats } from '../../lib/hooks/use-organisation-stats';

// =====================================================================
// TYPES
// =====================================================================

interface OrganisationDetailModalProps {
  organisation: EnseigneOrganisation | null;
  stats?: OrganisationStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// =====================================================================
// COMPONENT
// =====================================================================

export function OrganisationDetailModal({
  organisation,
  stats,
  open,
  onOpenChange,
}: OrganisationDetailModalProps) {
  if (!organisation) return null;

  const displayName = organisation.trade_name || organisation.legal_name;

  // Construire l'adresse complète
  const shippingAddress = [
    organisation.shipping_address_line1,
    [organisation.shipping_postal_code, organisation.shipping_city]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const mainAddress = [organisation.postal_code, organisation.city]
    .filter(Boolean)
    .join(' ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dialogSize="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-linkme-turquoise/10 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-linkme-turquoise" />
            </div>
            <div>
              <DialogTitle>{displayName}</DialogTitle>
              {organisation.trade_name &&
                organisation.trade_name !== organisation.legal_name && (
                  <DialogDescription>
                    {organisation.legal_name}
                  </DialogDescription>
                )}
            </div>
          </div>
        </DialogHeader>

        {/* Adresses */}
        <div className="space-y-4 mt-4">
          {/* Adresse de livraison */}
          {shippingAddress && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Adresse de livraison
                </p>
                <p className="text-sm text-gray-900">{shippingAddress}</p>
              </div>
            </div>
          )}

          {/* Adresse principale (si différente) */}
          {mainAddress && !shippingAddress && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Adresse
                </p>
                <p className="text-sm text-gray-900">{mainAddress}</p>
              </div>
            </div>
          )}

          {/* Stats financières */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Euro className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-blue-600 font-medium mb-1">CA HT</p>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(stats?.totalRevenueHT ?? 0)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <Coins className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-green-600 font-medium mb-1">
                Commissions
              </p>
              <p className="text-lg font-bold text-green-900">
                {formatCurrency(stats?.totalCommissionsHT ?? 0)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <Package className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-purple-600 font-medium mb-1">
                Commandes
              </p>
              <p className="text-lg font-bold text-purple-900">
                {stats?.orderCount ?? 0}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OrganisationDetailModal;
