'use client';

/**
 * OrganisationDetailModal
 *
 * Modal de visualisation des détails d'une organisation
 * Affiche toutes les infos, CA et commissions + Contacts groupés par rôle
 *
 * @module OrganisationDetailModal
 * @since 2026-01-10
 * @updated 2026-01-21 - Ajout liste contacts
 */

import { useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button as _Button,
} from '@verone/ui';
import {
  Building2,
  MapPin,
  Euro,
  Coins,
  Package,
  Users,
  Loader2,
  UserX,
} from 'lucide-react';

import type { EnseigneOrganisation } from '../../lib/hooks/use-enseigne-organisations';
import { useOrganisationContacts } from '../../lib/hooks/use-organisation-contacts';
import type { OrganisationStats } from '../../lib/hooks/use-organisation-stats';
import { ContactDisplayCard } from '../contacts/ContactDisplayCard';

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
  // IMPORTANT: Les hooks doivent être appelés avant tout early return
  // Fetch contacts (utilise organisation.id si disponible, sinon string vide)
  const { data: contactsData, isLoading: contactsLoading } =
    useOrganisationContacts(organisation?.id ?? '');

  // Group contacts by role
  const groupedContacts = useMemo(() => {
    const contacts = contactsData?.contacts ?? [];
    return {
      primary: contacts.filter(c => c.isPrimaryContact),
      billing: contacts.filter(c => c.isBillingContact && !c.isPrimaryContact),
      commercial: contacts.filter(
        c => c.isCommercialContact && !c.isPrimaryContact && !c.isBillingContact
      ),
      technical: contacts.filter(
        c => c.isTechnicalContact && !c.isPrimaryContact && !c.isBillingContact
      ),
      others: contacts.filter(
        c =>
          !c.isPrimaryContact &&
          !c.isBillingContact &&
          !c.isCommercialContact &&
          !c.isTechnicalContact
      ),
    };
  }, [contactsData]);

  // Early return après les hooks
  if (!organisation) return null;

  const displayName = organisation.trade_name ?? organisation.legal_name;

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

          {/* Section Contacts */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                Contacts
              </h4>
              <Badge variant="outline">
                {contactsData?.contacts.length ?? 0} contact(s)
              </Badge>
            </div>

            {contactsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : contactsData?.contacts.length === 0 ? (
              // Empty state
              <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                <UserX className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 mb-4">
                  Aucun contact enregistré
                </p>
                <p className="text-xs text-gray-400">
                  Les contacts peuvent être ajoutés depuis la fiche organisation
                </p>
              </div>
            ) : (
              // Contacts grouped by role
              <div className="space-y-4">
                {/* Primary Contact */}
                {groupedContacts.primary.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">
                      Contact Principal
                    </h5>
                    <div className="space-y-2">
                      {groupedContacts.primary.map(contact => (
                        <ContactDisplayCard
                          key={contact.id}
                          contact={contact}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Billing Contact */}
                {groupedContacts.billing.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">
                      Contact Facturation
                    </h5>
                    <div className="space-y-2">
                      {groupedContacts.billing.map(contact => (
                        <ContactDisplayCard
                          key={contact.id}
                          contact={contact}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Commercial Contact */}
                {groupedContacts.commercial.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">
                      Contact Commercial
                    </h5>
                    <div className="space-y-2">
                      {groupedContacts.commercial.map(contact => (
                        <ContactDisplayCard
                          key={contact.id}
                          contact={contact}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Contact */}
                {groupedContacts.technical.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">
                      Contact Technique
                    </h5>
                    <div className="space-y-2">
                      {groupedContacts.technical.map(contact => (
                        <ContactDisplayCard
                          key={contact.id}
                          contact={contact}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Others */}
                {groupedContacts.others.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">
                      Autres Contacts
                    </h5>
                    <div className="space-y-2">
                      {groupedContacts.others.map(contact => (
                        <ContactDisplayCard
                          key={contact.id}
                          contact={contact}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OrganisationDetailModal;
