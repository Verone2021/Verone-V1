'use client';

import { Badge, Card, CardContent, CardTitle } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import {
  OrganisationLogo,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { MapPin } from 'lucide-react';

import { PartnerActions } from './PartnerActions';

interface PartnersGridViewProps {
  paginatedPartners: Organisation[];
  isLoading: boolean;
  activeTab: 'active' | 'archived' | 'preferred';
  onArchive: (partner: Organisation) => Promise<void>;
  onDelete: (partner: Organisation) => void;
  onFavoriteToggle: () => void;
}

export function PartnersGridView({
  paginatedPartners,
  isLoading,
  activeTab,
  onArchive,
  onDelete,
  onFavoriteToggle,
}: PartnersGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
      {isLoading
        ? Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent style={{ padding: spacing[2] }}>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))
        : paginatedPartners.map(partner => (
            <Card
              key={partner.id}
              className="hover:shadow-lg transition-all duration-200"
              data-testid="partner-card"
            >
              <CardContent
                className="flex flex-col h-full"
                style={{ padding: spacing[3] }}
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <OrganisationLogo
                      logoUrl={partner.logo_url}
                      organisationName={getOrganisationDisplayName(partner)}
                      size="md"
                      fallback="initials"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] flex-1">
                        {partner.website ? (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: colors.text.DEFAULT }}
                            data-testid="partner-name"
                          >
                            {getOrganisationDisplayName(partner)}
                          </a>
                        ) : (
                          <span
                            style={{ color: colors.text.DEFAULT }}
                            data-testid="partner-name"
                          >
                            {getOrganisationDisplayName(partner)}
                          </span>
                        )}
                      </CardTitle>
                      {partner.archived_at && (
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

                    <div className="mt-3 min-h-[2.5rem] space-y-0.5">
                      {partner.billing_address_line1 && (
                        <div
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: colors.text.subtle }}
                        >
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate line-clamp-1">
                            {partner.billing_address_line1}
                          </span>
                        </div>
                      )}
                      {(!!partner.billing_postal_code ||
                        !!partner.billing_city) && (
                        <div
                          className="text-xs pl-[18px]"
                          style={{ color: colors.text.subtle }}
                        >
                          <span className="truncate line-clamp-1">
                            {partner.billing_postal_code &&
                              `${partner.billing_postal_code}, `}
                            {partner.billing_city}
                          </span>
                        </div>
                      )}
                      {partner.billing_country && (
                        <div
                          className="text-xs pl-[18px]"
                          style={{ color: colors.text.subtle }}
                        >
                          <span className="truncate line-clamp-1">
                            {partner.billing_country}
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className="mt-auto pt-4 border-t"
                      style={{ borderColor: colors.border.DEFAULT }}
                    >
                      <PartnerActions
                        partner={partner}
                        activeTab={activeTab}
                        onArchive={onArchive}
                        onDelete={onDelete}
                        onFavoriteToggle={onFavoriteToggle}
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
