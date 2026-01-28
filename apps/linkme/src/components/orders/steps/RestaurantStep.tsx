'use client';

/**
 * RestaurantStep - Étape 1 du formulaire de commande
 *
 * Permet de :
 * - Sélectionner un restaurant existant (avec recherche et filtres)
 * - Créer un nouveau restaurant
 *
 * @module RestaurantStep
 * @since 2026-01-20
 */

import { useState, useMemo, useEffect } from 'react';

import { OrganisationLogo } from '@verone/organisations/components/display/OrganisationLogo';
import {
  Card,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  cn,
  AddressAutocomplete,
  type AddressResult,
} from '@verone/ui';
import {
  Search,
  Store,
  Plus,
  MapPin,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import type { EnseigneOrganisation } from '../../../lib/hooks/use-enseigne-organisations';
import { useEnseigneOrganisations } from '../../../lib/hooks/use-enseigne-organisations';
import { useUpdateOrganisationOwnershipType } from '../../../lib/hooks/use-update-organisation-ownership-type';
import { useUserAffiliate } from '../../../lib/hooks/use-user-selection';
import type {
  OrderFormData,
  RestaurantStepData,
} from '../schemas/order-form.schema';

// ============================================================================
// TYPES
// ============================================================================

interface RestaurantStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<RestaurantStepData>) => void;
}

type TabFilter = 'all' | 'succursale' | 'franchise';

// Pagination
const ITEMS_PER_PAGE = 9;

// ============================================================================
// HELPERS
// ============================================================================

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

// ============================================================================
// COMPONENT
// ============================================================================

export function RestaurantStep({
  formData,
  errors: _errors,
  onUpdate,
}: RestaurantStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [detectedCountry, setDetectedCountry] = useState<{
    code: string;
    name: string;
  } | null>(null);

  // Récupérer l'affilié
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  // Récupérer les organisations de l'enseigne via l'affilié
  // Le hook fait lui-même la résolution affiliateId → enseigne_id → organisations
  const { data: organisations, isLoading: orgsLoading } =
    useEnseigneOrganisations(affiliate?.id ?? null);

  // Mutation pour persister le ownership_type en BD
  const { mutateAsync: updateOwnershipType, isPending: isUpdatingType } =
    useUpdateOrganisationOwnershipType();

  const isLoading = affiliateLoading || orgsLoading;
  const mode = formData.restaurant.mode;

  // Filtrer les organisations
  const filteredOrganisations = useMemo(() => {
    if (!organisations) return [];

    let filtered = organisations;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        org =>
          (org.trade_name ?? '').toLowerCase().includes(query) ||
          (org.legal_name ?? '').toLowerCase().includes(query) ||
          (org.city ?? '').toLowerCase().includes(query)
      );
    }

    // Filtre par onglet
    if (activeTab !== 'all') {
      filtered = filtered.filter(org => org.ownership_type === activeTab);
    }

    return filtered;
  }, [organisations, searchQuery, activeTab]);

  // Stats pour les onglets
  const tabStats = useMemo(() => {
    if (!organisations) return { all: 0, succursale: 0, franchise: 0 };
    return {
      all: organisations.length,
      succursale: organisations.filter(o => o.ownership_type === 'succursale')
        .length,
      franchise: organisations.filter(o => o.ownership_type === 'franchise')
        .length,
    };
  }, [organisations]);

  // Pagination
  const totalPages = Math.ceil(filteredOrganisations.length / ITEMS_PER_PAGE);
  const paginatedOrganisations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrganisations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrganisations, currentPage]);

  // Reset page quand filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Handlers
  const handleModeChange = (newMode: 'existing' | 'new') => {
    onUpdate({
      mode: newMode,
      existingId: null,
      existingName: undefined,
      existingCity: undefined,
      existingOwnershipType: null,
      existingCountry: null,
    });
  };

  const handleSelectRestaurant = (org: EnseigneOrganisation) => {
    onUpdate({
      mode: 'existing',
      existingId: org.id,
      existingName: org.trade_name ?? org.legal_name,
      existingCity: org.city ?? undefined,
      existingOwnershipType: org.ownership_type as
        | 'succursale'
        | 'franchise'
        | null,
      existingCountry: org.country, // Pour calcul TVA (FR=20%, autres=0%)
    });
  };

  const handleNewRestaurantChange = (field: string, value: string) => {
    const currentData = formData.restaurant.newRestaurant;
    const ownershipType =
      field === 'ownershipType'
        ? (value as 'succursale' | 'franchise')
        : (currentData?.ownershipType ?? 'succursale'); // Default to succursale if not set

    onUpdate({
      newRestaurant: {
        tradeName: currentData?.tradeName ?? '',
        city: currentData?.city ?? '',
        postalCode: currentData?.postalCode ?? '',
        address: currentData?.address ?? '',
        country: currentData?.country ?? 'FR',
        latitude: currentData?.latitude ?? null,
        longitude: currentData?.longitude ?? null,
        ownershipType,
        [field]: value,
      },
    });
  };

  // Handler pour la sélection d'adresse via AddressAutocomplete
  const handleAddressSelect = (address: AddressResult) => {
    const currentData = formData.restaurant.newRestaurant;

    // Mettre à jour le pays détecté pour l'affichage
    setDetectedCountry({
      code: address.countryCode,
      name: address.country,
    });

    onUpdate({
      newRestaurant: {
        tradeName: currentData?.tradeName ?? '',
        ownershipType: currentData?.ownershipType ?? 'succursale',
        address: address.streetAddress,
        postalCode: address.postalCode,
        city: address.city,
        country: address.countryCode, // 'FR', 'LU', 'BE', etc.
        latitude: address.latitude,
        longitude: address.longitude,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toggle Mode */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => handleModeChange('existing')}
          className={cn(
            'flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all',
            mode === 'existing'
              ? 'border-linkme-turquoise bg-linkme-turquoise/5'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <Store
            className={cn(
              'h-5 w-5',
              mode === 'existing' ? 'text-linkme-turquoise' : 'text-gray-400'
            )}
          />
          <span
            className={cn(
              'font-medium',
              mode === 'existing' ? 'text-linkme-turquoise' : 'text-gray-600'
            )}
          >
            Restaurant existant
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('new')}
          className={cn(
            'flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all',
            mode === 'new'
              ? 'border-linkme-turquoise bg-linkme-turquoise/5'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <Plus
            className={cn(
              'h-5 w-5',
              mode === 'new' ? 'text-linkme-turquoise' : 'text-gray-400'
            )}
          />
          <span
            className={cn(
              'font-medium',
              mode === 'new' ? 'text-linkme-turquoise' : 'text-gray-600'
            )}
          >
            Nouveau restaurant
          </span>
        </button>
      </div>

      {/* Mode: Restaurant existant */}
      {mode === 'existing' && (
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom ou ville..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
                onClick={() => setActiveTab(tab.id)}
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
                      onClick={() => handleSelectRestaurant(org)}
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
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                    onClick={() =>
                      setCurrentPage(p => Math.min(totalPages, p + 1))
                    }
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

          {/* Validation ownership_type si manquant - OBLIGATOIRE pour continuer */}
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

                      // Wrapper async avec void + catch
                      void (async () => {
                        try {
                          // 1. Sauvegarder en BD immédiatement
                          await updateOwnershipType({
                            organisationId,
                            ownershipType,
                          });
                          // 2. Mettre à jour le state local
                          onUpdate({ existingOwnershipType: ownershipType });
                        } catch (error) {
                          console.error(
                            '[RestaurantStep] Update ownership type failed:',
                            error
                          );
                          // Erreur gérée par le hook (toast d'erreur)
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
      )}

      {/* Mode: Nouveau restaurant */}
      {mode === 'new' && (
        <Card className="p-6">
          <div className="space-y-6">
            {/* Type de propriété */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Type de restaurant <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.restaurant.newRestaurant?.ownershipType ?? ''}
                onValueChange={value =>
                  handleNewRestaurantChange('ownershipType', value)
                }
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="succursale" id="type-succursale" />
                  <Label
                    htmlFor="type-succursale"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Propre
                    </div>
                    <span className="text-sm text-gray-600">
                      Restaurant en propre
                    </span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="franchise" id="type-franchise" />
                  <Label
                    htmlFor="type-franchise"
                    className="flex items-center gap-2 cursor-pointer"
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
            </div>

            {/* Nom commercial */}
            <div className="space-y-2">
              <Label htmlFor="tradeName">
                Nom commercial <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tradeName"
                type="text"
                placeholder="Ex: Restaurant La Belle Vue"
                value={formData.restaurant.newRestaurant?.tradeName ?? ''}
                onChange={e =>
                  handleNewRestaurantChange('tradeName', e.target.value)
                }
              />
            </div>

            {/* Adresse avec autocomplétion (récupère automatiquement ville, CP, pays, GPS) */}
            <AddressAutocomplete
              label="Adresse du restaurant"
              placeholder="Rechercher une adresse..."
              onSelect={handleAddressSelect}
              value={formData.restaurant.newRestaurant?.address ?? ''}
              onChange={value => handleNewRestaurantChange('address', value)}
            />

            {/* Affichage du pays détecté avec badge TVA */}
            {detectedCountry && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Pays détecté :</span>
                  <span className="font-medium">{detectedCountry.name}</span>
                  {detectedCountry.code !== 'FR' ? (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      TVA 0%
                    </span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      TVA 20%
                    </span>
                  )}
                </div>
                {formData.restaurant.newRestaurant?.city && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {formData.restaurant.newRestaurant.postalCode}{' '}
                    {formData.restaurant.newRestaurant.city}
                  </p>
                )}
              </div>
            )}

            {/* Ville (remplie automatiquement mais modifiable) */}
            <div className="space-y-2">
              <Label htmlFor="city">
                Ville <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                type="text"
                placeholder="Paris"
                value={formData.restaurant.newRestaurant?.city ?? ''}
                onChange={e =>
                  handleNewRestaurantChange('city', e.target.value)
                }
              />
              <p className="text-xs text-gray-500">
                Remplie automatiquement par l&apos;adresse ou saisissez
                manuellement
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default RestaurantStep;
