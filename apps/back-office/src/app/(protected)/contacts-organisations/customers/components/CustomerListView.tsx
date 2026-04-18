'use client';

import { Badge } from '@verone/ui';
import {
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
  getOrganisationCardName,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { ExternalLink } from 'lucide-react';

import { CustomerCardActions } from './CustomerCardActions';

// List view: only active and preferred show archive button (not incomplete)
function isActiveTab(tab: 'active' | 'archived' | 'preferred' | 'incomplete') {
  return tab === 'active' || tab === 'preferred';
}

interface CustomerListViewProps {
  isLoading: boolean;
  paginatedCustomers: Organisation[];
  activeTab: 'active' | 'archived' | 'preferred' | 'incomplete';
  onArchive: (customer: Organisation) => void;
  onDelete: (customer: Organisation) => void;
  onRefetch: () => void;
  onLoadArchived: () => void;
}

export function CustomerListView({
  isLoading,
  paginatedCustomers,
  activeTab,
  onArchive,
  onDelete,
  onRefetch,
  onLoadArchived,
}: CustomerListViewProps) {
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
              Client
            </TableHead>
            <TableHead
              className="hidden md:table-cell"
              style={{ color: colors.text.DEFAULT }}
            >
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
            : paginatedCustomers.map(customer => (
                <TableRow key={customer.id} className="hover:bg-muted/50">
                  {/* Logo + Nom avec lien site web */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <OrganisationLogo
                        logoUrl={customer.logo_url}
                        organisationName={getOrganisationDisplayName(customer)}
                        size="sm"
                        fallback="initials"
                      />
                      <div>
                        {customer.website ? (
                          <a
                            href={customer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline flex items-center gap-1"
                            style={{ color: colors.text.DEFAULT }}
                          >
                            {getOrganisationCardName(customer)}
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
                            {getOrganisationCardName(customer)}
                          </span>
                        )}
                        {customer.archived_at && (
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

                  {/* Adresse complète */}
                  <TableCell className="hidden md:table-cell">
                    <div
                      className="text-sm"
                      style={{ color: colors.text.subtle }}
                    >
                      {customer.billing_address_line1 && (
                        <div>{customer.billing_address_line1}</div>
                      )}
                      {}
                      {(!!customer.billing_postal_code ||
                        !!customer.billing_city) && (
                        <div>
                          {customer.billing_postal_code &&
                            `${customer.billing_postal_code}, `}
                          {customer.billing_city}
                        </div>
                      )}
                      {customer.billing_country && (
                        <div>{customer.billing_country}</div>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions - Pattern Catalogue IconButton */}
                  <TableCell className="text-right">
                    <CustomerCardActions
                      customer={customer}
                      isActive={isActiveTab(activeTab)}
                      onArchive={onArchive}
                      onDelete={onDelete}
                      onRefetch={onRefetch}
                      onLoadArchived={onLoadArchived}
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
