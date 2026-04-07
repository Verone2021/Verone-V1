'use client';

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import {
  OrganisationLogo,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { ExternalLink } from 'lucide-react';

import { PartnerActions } from './PartnerActions';

interface PartnersListViewProps {
  paginatedPartners: Organisation[];
  isLoading: boolean;
  activeTab: 'active' | 'archived' | 'preferred';
  onArchive: (partner: Organisation) => Promise<void>;
  onDelete: (partner: Organisation) => void;
  onFavoriteToggle: () => void;
}

export function PartnersListView({
  paginatedPartners,
  isLoading,
  activeTab,
  onArchive,
  onDelete,
  onFavoriteToggle,
}: PartnersListViewProps) {
  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: colors.border.DEFAULT }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="w-[50%]"
              style={{ color: colors.text.DEFAULT }}
            >
              Partenaire
            </TableHead>
            <TableHead style={{ color: colors.text.DEFAULT }}>
              Adresse
            </TableHead>
            <TableHead
              className="w-[150px] text-right"
              style={{ color: colors.text.DEFAULT }}
            >
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </TableCell>
                </TableRow>
              ))
            : paginatedPartners.map(partner => (
                <TableRow key={partner.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <OrganisationLogo
                        logoUrl={partner.logo_url}
                        organisationName={getOrganisationDisplayName(partner)}
                        size="sm"
                        fallback="initials"
                      />
                      <div>
                        {partner.website ? (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline flex items-center gap-1"
                            style={{ color: colors.text.DEFAULT }}
                          >
                            {getOrganisationDisplayName(partner)}
                            <ExternalLink
                              className="h-3 w-3"
                              style={{ color: colors.text.muted }}
                            />
                          </a>
                        ) : (
                          <span
                            className="font-medium"
                            style={{ color: colors.text.DEFAULT }}
                          >
                            {getOrganisationDisplayName(partner)}
                          </span>
                        )}
                        {partner.archived_at && (
                          <Badge
                            variant="destructive"
                            className="text-xs ml-2"
                            style={{
                              backgroundColor: colors.danger[100],
                              color: colors.danger[700],
                            }}
                          >
                            Archivé
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div
                      className="text-sm"
                      style={{ color: colors.text.subtle }}
                    >
                      {partner.billing_address_line1 && (
                        <div>{partner.billing_address_line1}</div>
                      )}
                      {(!!partner.billing_postal_code ||
                        !!partner.billing_city) && (
                        <div>
                          {partner.billing_postal_code &&
                            `${partner.billing_postal_code}, `}
                          {partner.billing_city}
                        </div>
                      )}
                      {partner.billing_country && (
                        <div>{partner.billing_country}</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <PartnerActions
                      partner={partner}
                      activeTab={activeTab}
                      onArchive={onArchive}
                      onDelete={onDelete}
                      onFavoriteToggle={onFavoriteToggle}
                      className="flex justify-end items-center gap-1"
                    />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
