'use client';

import {
  OrganisationLogo,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { ExternalLink, Package } from 'lucide-react';

import { SupplierCardActions } from './SupplierCardActions';

interface SuppliersListViewProps {
  suppliers: Organisation[];
  isLoading: boolean;
  activeTab: 'active' | 'archived' | 'preferred';
  onArchive: (supplier: Organisation) => Promise<void>;
  onDelete: (supplier: Organisation) => void;
  onFavoriteRefresh: () => void;
}

export function SuppliersListView({
  suppliers,
  isLoading,
  activeTab,
  onArchive,
  onDelete,
  onFavoriteRefresh,
}: SuppliersListViewProps) {
  const isActive = activeTab === 'active' || activeTab === 'preferred';

  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: colors.border.DEFAULT }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="w-[40%]"
              style={{ color: colors.text.DEFAULT }}
            >
              Fournisseur
            </TableHead>
            <TableHead style={{ color: colors.text.DEFAULT }}>
              Adresse
            </TableHead>
            <TableHead
              className="w-[120px] text-center"
              style={{ color: colors.text.DEFAULT }}
            >
              Produits
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
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </TableCell>
                </TableRow>
              ))
            : suppliers.map(supplier => (
                <TableRow key={supplier.id} className="hover:bg-muted/50">
                  {/* Logo + Nom */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <OrganisationLogo
                        logoUrl={supplier.logo_url}
                        organisationName={getOrganisationDisplayName(supplier)}
                        size="sm"
                        fallback="initials"
                      />
                      <div>
                        {supplier.website ? (
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline flex items-center gap-1"
                            style={{ color: colors.text.DEFAULT }}
                          >
                            {getOrganisationDisplayName(supplier)}
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
                            {getOrganisationDisplayName(supplier)}
                          </span>
                        )}
                        {supplier.archived_at && (
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
                  <TableCell>
                    <div
                      className="text-sm"
                      style={{ color: colors.text.subtle }}
                    >
                      {supplier.billing_address_line1 && (
                        <div>{supplier.billing_address_line1}</div>
                      )}
                      {(!!supplier.billing_postal_code ||
                        !!supplier.billing_city) && (
                        <div>
                          {supplier.billing_postal_code &&
                            `${supplier.billing_postal_code}, `}
                          {supplier.billing_city}
                        </div>
                      )}
                      {supplier.billing_country && (
                        <div>{supplier.billing_country}</div>
                      )}
                    </div>
                  </TableCell>

                  {/* Compteur Produits */}
                  <TableCell className="text-center">
                    {supplier._count?.products !== undefined && (
                      <div
                        className="flex items-center justify-center gap-1.5 text-sm"
                        style={{ color: colors.text.muted }}
                      >
                        <Package className="h-4 w-4" />
                        <span>{supplier._count.products}</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <SupplierCardActions
                        supplier={supplier}
                        isActive={isActive}
                        onArchive={onArchive}
                        onDelete={onDelete}
                        onFavoriteRefresh={onFavoriteRefresh}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
