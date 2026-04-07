'use client';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import {
  OrganisationLogo,
  getOrganisationCardName,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { MapPin } from 'lucide-react';

import { MissingFieldsBadges, getOwnershipBadge } from './customer-utils';
import { CustomerCardActions } from './CustomerCardActions';

// Grid view: active, preferred, incomplete all show archive button
function isActiveTab(tab: 'active' | 'archived' | 'preferred' | 'incomplete') {
  return tab === 'active' || tab === 'preferred' || tab === 'incomplete';
}

interface CustomerGridViewProps {
  isLoading: boolean;
  paginatedCustomers: Organisation[];
  activeTab: 'active' | 'archived' | 'preferred' | 'incomplete';
  onArchive: (customer: Organisation) => void;
  onDelete: (customer: Organisation) => void;
  onRefetch: () => void;
  onLoadArchived: () => void;
}

export function CustomerGridView({
  isLoading,
  paginatedCustomers,
  activeTab,
  onArchive,
  onDelete,
  onRefetch,
  onLoadArchived,
}: CustomerGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
      {isLoading
        ? Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader style={{ padding: spacing[2] }}>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent style={{ padding: spacing[2] }}>
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))
        : paginatedCustomers.map(customer => (
            <Card
              key={customer.id}
              className="hover:shadow-lg transition-all duration-200"
              data-testid="customer-card"
            >
              <CardContent
                className="flex flex-col h-full"
                style={{ padding: spacing[3] }}
              >
                {/* Layout Horizontal Spacieux - Logo GAUCHE + Infos DROITE */}
                <div className="flex gap-4">
                  {/* Logo GAUCHE - MD (48px) */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <OrganisationLogo
                      logoUrl={customer.logo_url}
                      organisationName={getOrganisationDisplayName(customer)}
                      size="md"
                      fallback="initials"
                    />
                  </div>

                  {/* Contenu DROITE - Stack vertical avec hauteurs fixes */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Ligne 1: Nom + Badge Archivé */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Nom du client */}
                        <CardTitle className="text-sm font-semibold line-clamp-2">
                          {customer.website ? (
                            <a
                              href={customer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              style={{ color: colors.text.DEFAULT }}
                              data-testid="customer-name"
                            >
                              {getOrganisationCardName(customer)}
                            </a>
                          ) : (
                            <span
                              style={{ color: colors.text.DEFAULT }}
                              data-testid="customer-name"
                            >
                              {getOrganisationCardName(customer)}
                            </span>
                          )}
                        </CardTitle>

                        {/* Badge Ownership Type en-dessous du nom, aligné à gauche */}
                        {(() => {
                          const badge = getOwnershipBadge(
                            customer.ownership_type
                          );
                          return badge ? (
                            <span
                              className={cn(
                                'inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded',
                                badge.className
                              )}
                            >
                              {badge.label}
                            </span>
                          ) : null;
                        })()}
                      </div>

                      {/* Badge Archivé à droite */}
                      {customer.archived_at && (
                        <Badge
                          variant="destructive"
                          className="text-xs flex-shrink-0"
                          style={{
                            backgroundColor: colors.danger[100],
                            color: colors.danger[700],
                          }}
                        >
                          Archivé
                        </Badge>
                      )}
                    </div>

                    {/* Adresse de facturation - Espace réservé même si vide */}
                    <div className="mt-3 min-h-[2.5rem] space-y-0.5">
                      {customer.billing_address_line1 && (
                        <div
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: colors.text.subtle }}
                        >
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate line-clamp-1">
                            {customer.billing_address_line1}
                          </span>
                        </div>
                      )}
                      {}
                      {(!!customer.billing_postal_code ||
                        !!customer.billing_city) && (
                        <div
                          className="text-xs pl-[18px]"
                          style={{ color: colors.text.subtle }}
                        >
                          <span className="truncate line-clamp-1">
                            {customer.billing_postal_code &&
                              `${customer.billing_postal_code}, `}
                            {customer.billing_city}
                          </span>
                        </div>
                      )}
                      {customer.billing_country && (
                        <div
                          className="text-xs pl-[18px]"
                          style={{ color: colors.text.subtle }}
                        >
                          <span className="truncate line-clamp-1">
                            {customer.billing_country}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badges champs manquants - Visible uniquement onglet incomplete */}
                    {activeTab === 'incomplete' && (
                      <MissingFieldsBadges customer={customer} />
                    )}

                    {/* Boutons - Pattern Catalogue IconButton */}
                    <div
                      className="mt-auto pt-4 border-t"
                      style={{ borderColor: colors.border.DEFAULT }}
                    >
                      <CustomerCardActions
                        customer={customer}
                        isActive={isActiveTab(activeTab)}
                        onArchive={onArchive}
                        onDelete={onDelete}
                        onRefetch={onRefetch}
                        onLoadArchived={onLoadArchived}
                        className="flex items-center gap-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
    </div>
  );
}
