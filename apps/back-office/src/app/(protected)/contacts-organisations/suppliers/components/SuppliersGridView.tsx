'use client';

import {
  OrganisationLogo,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Badge } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { MapPin, Package } from 'lucide-react';

import { SupplierCardActions } from './SupplierCardActions';

interface SuppliersGridViewProps {
  suppliers: Organisation[];
  isLoading: boolean;
  activeTab: 'active' | 'archived' | 'preferred';
  onArchive: (supplier: Organisation) => Promise<void>;
  onDelete: (supplier: Organisation) => void;
  onFavoriteRefresh: () => void;
}

export function SuppliersGridView({
  suppliers,
  isLoading,
  activeTab,
  onArchive,
  onDelete,
  onFavoriteRefresh,
}: SuppliersGridViewProps) {
  const isActive = activeTab === 'active' || activeTab === 'preferred';

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
        : suppliers.map(supplier => (
            <Card
              key={supplier.id}
              className="hover:shadow-lg transition-all duration-200"
              data-testid="supplier-card"
            >
              <CardContent
                className="flex flex-col h-full"
                style={{ padding: spacing[3] }}
              >
                <div className="flex gap-4">
                  {/* Logo GAUCHE - MD (48px) */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <OrganisationLogo
                      logoUrl={supplier.logo_url}
                      organisationName={getOrganisationDisplayName(supplier)}
                      size="md"
                      fallback="initials"
                    />
                  </div>

                  {/* Contenu DROITE */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Nom + Badge Archivé */}
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] flex-1">
                        {supplier.website ? (
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: colors.text.DEFAULT }}
                            data-testid="supplier-name"
                          >
                            {getOrganisationDisplayName(supplier)}
                          </a>
                        ) : (
                          <span
                            style={{ color: colors.text.DEFAULT }}
                            data-testid="supplier-name"
                          >
                            {getOrganisationDisplayName(supplier)}
                          </span>
                        )}
                      </CardTitle>

                      {supplier.archived_at && (
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

                    {/* Adresse de facturation */}
                    <div className="mt-3 min-h-[2.5rem] space-y-0.5">
                      {supplier.billing_address_line1 && (
                        <div
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: colors.text.subtle }}
                        >
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate line-clamp-1">
                            {supplier.billing_address_line1}
                          </span>
                        </div>
                      )}
                      {(!!supplier.billing_postal_code ||
                        !!supplier.billing_city) && (
                        <div
                          className="text-xs pl-[18px]"
                          style={{ color: colors.text.subtle }}
                        >
                          <span className="truncate line-clamp-1">
                            {supplier.billing_postal_code &&
                              `${supplier.billing_postal_code}, `}
                            {supplier.billing_city}
                          </span>
                        </div>
                      )}
                      {supplier.billing_country && (
                        <div
                          className="text-xs pl-[18px]"
                          style={{ color: colors.text.subtle }}
                        >
                          <span className="truncate line-clamp-1">
                            {supplier.billing_country}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Compteur produits */}
                    <div className="min-h-[2rem] mb-2">
                      {supplier._count?.products !== undefined && (
                        <div
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: colors.text.muted }}
                        >
                          <Package className="h-3 w-3 flex-shrink-0" />
                          <span>{supplier._count.products} produit(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Boutons */}
                    <div
                      className="mt-auto pt-4 border-t"
                      style={{ borderColor: colors.border.DEFAULT }}
                    >
                      <div className="flex items-center gap-1">
                        <SupplierCardActions
                          supplier={supplier}
                          isActive={isActive}
                          onArchive={onArchive}
                          onDelete={onDelete}
                          onFavoriteRefresh={onFavoriteRefresh}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
    </div>
  );
}
