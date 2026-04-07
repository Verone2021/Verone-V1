'use client';

import { OrganisationLogo } from '@verone/organisations/components/display/OrganisationLogo';
import { Card, Input, Label, RadioGroup, RadioGroupItem, cn } from '@verone/ui';
import {
  Search,
  Store,
  MapPin,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import type { EnseigneOrganisation } from '../../../../../lib/hooks/use-enseigne-organisations';
import type { OrderFormData } from '../../../schemas/order-form.schema';
import type { TabFilter } from '../types';
import { getOwnershipBadge } from '../helpers';

interface TabStats {
  all: number;
  succursale: number;
  franchise: number;
}

interface ExistingRestaurantModeProps {
  formData: OrderFormData;
  isLoading: boolean;
  isUpdatingType: boolean;
  paginatedOrganisations: EnseigneOrganisation[];
  filteredOrganisations: EnseigneOrganisation[];
  totalPages: number;
  currentPage: number;
  tabStats: TabStats;
  activeTab: TabFilter;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: TabFilter) => void;
  onPageChange: (updater: (p: number) => number) => void;
  onSelectRestaurant: (org: EnseigneOrganisation) => void;
  onUpdateOwnershipType: (params: {
    organisationId: string;
    ownershipType: 'succursale' | 'franchise';
  }) => Promise<unknown>;
  onUpdate: (
    data: Partial<{ existingOwnershipType: 'succursale' | 'franchise' | null }>
  ) => void;
}

export function ExistingRestaurantMode({
  formData,
  isLoading,
  isUpdatingType,
  paginatedOrganisations,
  filteredOrganisations,
  totalPages,
  currentPage,
  tabStats,
  activeTab,
  searchQuery,
  onSearchChange,
  onTabChange,
  onPageChange,
  onSelectRestaurant,
  onUpdateOwnershipType,
  onUpdate,
}: ExistingRestaurantModeProps) {
  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Rechercher par nom ou ville..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Onglets avec compteurs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'all' as const, label: 'Tous', count: tabStats.all },
          {
            id: 'succursale' as const,
            label: 'Propres',
            count: tabStats.succursale,
          },
          {
            id: 'franchise' as const,
            label: 'Franchises',
            count: tabStats.franchise,
          },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-linkme-turquoise text-linkme-turquoise'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'ml-2 px-2 py-0.5 text-xs rounded-full',
                activeTab === tab.id
                  ? 'bg-linkme-turquoise/10 text-linkme-turquoise'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grille de restaurants */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredOrganisations.length === 0 ? (
        <div className="text-center py-12">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun restaurant trouvé</p>
          {searchQuery && (
            <p className="text-sm text-gray-400 mt-1">
              Essayez avec d&apos;autres termes de recherche
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedOrganisations.map(org => {
              const isSelected = formData.restaurant.existingId === org.id;
              const badge = getOwnershipBadge(org.ownership_type);
              const displayName = org.trade_name ?? org.legal_name;

              return (
                <Card
                  key={org.id}
                  className={cn(
                    'p-3 cursor-pointer transition-all hover:shadow-md',
                    isSelected
                      ? 'border-2 border-green-500 bg-green-50/50'
                      : 'hover:border-gray-300'
                  )}
                  onClick={() => onSelectRestaurant(org)}
                >
                  <div className="flex items-start gap-2.5">
                    <OrganisationLogo
                      logoUrl={org.logo_url}
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
                        {badge && (
                          <span
                            className={cn(
                              'flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded',
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        )}
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
                        )}
                      </div>
                      {(org.city ?? org.shipping_city) && (
                        <div className="flex items-start gap-1 mt-1">
                          <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400 mt-0.5" />
                          <div className="text-xs text-gray-500 leading-tight">
                            {org.shipping_address_line1 && (
                              <div>{org.shipping_address_line1}</div>
                            )}
                            <div>
                              {[
                                org.shipping_postal_code ?? org.postal_code,
                                org.shipping_city ?? org.city,
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => onPageChange(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Précédent
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Restaurant sélectionné */}
      {formData.restaurant.existingId && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">
              Restaurant sélectionné : {formData.restaurant.existingName}
            </span>
            {formData.restaurant.existingCity && (
              <span className="text-green-600">
                ({formData.restaurant.existingCity})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Validation ownership_type si manquant */}
      {formData.restaurant.existingId &&
        !formData.restaurant.existingOwnershipType && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    Type de restaurant requis
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Ce restaurant n&apos;a pas de type défini. Veuillez le
                    spécifier pour continuer.
                  </p>
                </div>
              </div>
              <RadioGroup
                value={formData.restaurant.existingOwnershipType ?? ''}
                onValueChange={value => {
                  const organisationId = formData.restaurant.existingId;
                  if (!organisationId) return;

                  const ownershipType = value as 'succursale' | 'franchise';

                  void (async () => {
                    try {
                      await onUpdateOwnershipType({
                        organisationId,
                        ownershipType,
                      });
                      onUpdate({ existingOwnershipType: ownershipType });
                    } catch (error) {
                      console.error(
                        '[ExistingRestaurantMode] Update ownership type failed:',
                        error
                      );
                    }
                  })();
                }}
                disabled={isUpdatingType}
                className="flex gap-4 ml-7"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="succursale"
                    id="existing-type-succursale"
                    disabled={isUpdatingType}
                  />
                  <Label
                    htmlFor="existing-type-succursale"
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      isUpdatingType && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Propre
                    </div>
                    <span className="text-sm text-gray-600">
                      Succursale de l&apos;enseigne
                    </span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="franchise"
                    id="existing-type-franchise"
                    disabled={isUpdatingType}
                  />
                  <Label
                    htmlFor="existing-type-franchise"
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      isUpdatingType && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      Franchise
                    </div>
                    <span className="text-sm text-gray-600">
                      Restaurant franchisé
                    </span>
                  </Label>
                </div>
              </RadioGroup>
              {isUpdatingType && (
                <div className="flex items-center gap-2 ml-7 text-sm text-amber-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
