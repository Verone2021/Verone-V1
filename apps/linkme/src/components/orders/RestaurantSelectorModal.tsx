'use client';

/**
 * RestaurantSelectorModal — Modal professionnel de sélection restaurant
 *
 * Remplace le <select> natif (150+ items ingérable) par un modal avec :
 * - Recherche par nom, ville, adresse
 * - Tabs filtres : Tous / Propres / Franchises (avec compteurs)
 * - Vue Liste (grille paginée) + Vue Carte (MapLibre)
 * - Sélection pending → confirmation
 *
 * @module RestaurantSelectorModal
 * @since 2026-02-23
 */

import { useState, useMemo, useCallback } from 'react';

import dynamic from 'next/dynamic';
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@verone/ui';
import { OrganisationLogo } from '@verone/organisations/components/display/OrganisationLogo';
import {
  Store,
  Search,
  CheckCircle,
  List,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import type { EnseigneOrganisation } from '../../lib/hooks/use-enseigne-organisations';

// Import dynamique de la carte (SSR désactivé — maplibre-gl est browser-only)
const MapLibreMapView = dynamic(
  () => import('../shared/MapLibreMapView').then(m => m.MapLibreMapView),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height: 400 }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    ),
  }
);

// =====================================================================
// TYPES
// =====================================================================

interface RestaurantSelectorModalProps {
  organisations: EnseigneOrganisation[];
  selectedId: string | null;
  onSelect: (org: EnseigneOrganisation) => void;
  isLoading: boolean;
  error?: string | null;
}

type TabFilter = 'all' | 'succursale' | 'franchise';
type ViewMode = 'list' | 'map';

const ITEMS_PER_PAGE = 9;

// =====================================================================
// HELPERS
// =====================================================================

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

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function RestaurantSelectorModal({
  organisations,
  selectedId,
  onSelect,
  isLoading,
  error,
}: RestaurantSelectorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingOrg, setPendingOrg] = useState<EnseigneOrganisation | null>(
    null
  );

  // Organisation actuellement sélectionnée (pour le trigger)
  const selectedOrg = useMemo(
    () => organisations.find(o => o.id === selectedId) ?? null,
    [organisations, selectedId]
  );

  // ---- Filtrage ----
  const filteredOrganisations = useMemo(() => {
    let filtered = organisations;

    // Filtre recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        org =>
          (org.trade_name ?? '').toLowerCase().includes(query) ||
          (org.legal_name ?? '').toLowerCase().includes(query) ||
          (org.city ?? '').toLowerCase().includes(query) ||
          (org.shipping_address_line1 ?? '').toLowerCase().includes(query)
      );
    }

    // Filtre tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(org => org.ownership_type === activeTab);
    }

    return filtered;
  }, [organisations, searchQuery, activeTab]);

  // ---- Stats tabs ----
  const tabStats = useMemo(
    () => ({
      all: organisations.length,
      succursale: organisations.filter(o => o.ownership_type === 'succursale')
        .length,
      franchise: organisations.filter(o => o.ownership_type === 'franchise')
        .length,
    }),
    [organisations]
  );

  // ---- Pagination ----
  const totalPages = Math.ceil(filteredOrganisations.length / ITEMS_PER_PAGE);
  const paginatedOrganisations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrganisations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrganisations, currentPage]);

  // ---- Handlers ----
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tab: TabFilter) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleCardClick = useCallback((org: EnseigneOrganisation) => {
    setPendingOrg(org);
  }, []);

  const handleMarkerClick = useCallback(
    (mapOrg: {
      id: string;
      trade_name: string | null;
      legal_name: string;
      city: string | null;
    }) => {
      const org = organisations.find(o => o.id === mapOrg.id);
      if (org) setPendingOrg(org);
    },
    [organisations]
  );

  const handleConfirm = useCallback(() => {
    if (pendingOrg) {
      onSelect(pendingOrg);
      setIsOpen(false);
      setPendingOrg(null);
      setSearchQuery('');
      setActiveTab('all');
      setCurrentPage(1);
    }
  }, [pendingOrg, onSelect]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        // Reset state à l'ouverture
        setSearchQuery('');
        setActiveTab('all');
        setCurrentPage(1);
        // Pre-sélectionner l'org déjà choisie
        setPendingOrg(selectedOrg);
      }
    },
    [selectedOrg]
  );

  // ---- Tabs config ----
  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: tabStats.all },
    { id: 'succursale', label: 'Propres', count: tabStats.succursale },
    { id: 'franchise', label: 'Franchises', count: tabStats.franchise },
  ];

  return (
    <>
      {/* ====== BOUTON TRIGGER ====== */}
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        disabled={isLoading}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 border rounded-lg text-left transition-colors',
          'hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin flex-shrink-0" />
            <span className="text-sm text-gray-500">
              Chargement des restaurants...
            </span>
          </>
        ) : selectedOrg ? (
          <>
            <OrganisationLogo
              logoUrl={selectedOrg.logo_url}
              organisationName={
                selectedOrg.trade_name ?? selectedOrg.legal_name
              }
              size="sm"
              fallback="initials"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">
                  {selectedOrg.trade_name ?? selectedOrg.legal_name}
                </span>
                {selectedOrg.ownership_type && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs flex-shrink-0',
                      getOwnershipBadge(selectedOrg.ownership_type)?.className
                    )}
                  >
                    {getOwnershipBadge(selectedOrg.ownership_type)?.label}
                  </Badge>
                )}
              </div>
              {selectedOrg.city && (
                <span className="text-sm text-gray-500 truncate block">
                  {selectedOrg.city}
                </span>
              )}
            </div>
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          </>
        ) : (
          <>
            <Store className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-500">Choisir un restaurant</span>
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {/* ====== MODAL ====== */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent dialogSize="xl" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Sélectionner un restaurant</DialogTitle>
            <DialogDescription>
              {organisations.length} restaurant
              {organisations.length > 1 ? 's' : ''} disponible
              {organisations.length > 1 ? 's' : ''}
            </DialogDescription>

            {/* Barre recherche */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher par nom, ville ou adresse..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </DialogHeader>

          {/* ---- Toggle Vue + Tabs ---- */}
          <div className="flex items-center justify-between gap-4 px-1">
            {/* Toggle Liste / Carte */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <List className="h-4 w-4" />
                Liste
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <MapIcon className="h-4 w-4" />
                Carte
              </button>
            </div>

            {/* Tabs filtres (vue liste uniquement) */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    {tab.label}{' '}
                    <span className="text-xs opacity-70">{tab.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- CONTENU ---- */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {viewMode === 'list' ? (
              // ======== VUE LISTE ========
              <div className="space-y-4">
                {filteredOrganisations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Store className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucun restaurant trouvé</p>
                    <p className="text-sm mt-1">
                      Essayez un autre terme de recherche
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Grille 3 colonnes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paginatedOrganisations.map(org => {
                        const badge = getOwnershipBadge(org.ownership_type);
                        const isSelected = pendingOrg?.id === org.id;
                        const displayName = org.trade_name ?? org.legal_name;

                        return (
                          <Card
                            key={org.id}
                            className={cn(
                              'cursor-pointer transition-all hover:shadow-md',
                              isSelected && 'ring-2 ring-blue-500 bg-blue-50'
                            )}
                            onClick={() => handleCardClick(org)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <OrganisationLogo
                                  logoUrl={org.logo_url}
                                  organisationName={displayName}
                                  size="sm"
                                  fallback="initials"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {displayName}
                                    </h4>
                                    {badge && (
                                      <span
                                        className={cn(
                                          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                                          badge.className
                                        )}
                                      >
                                        {badge.label}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    {org.shipping_address_line1 ??
                                      org.address_line1 ??
                                      'Adresse non renseignée'}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {org.postal_code} {org.city}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-gray-500">
                          {filteredOrganisations.length} résultat
                          {filteredOrganisations.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() =>
                              setCurrentPage(p => Math.max(1, p - 1))
                            }
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Précédent
                          </Button>
                          <span className="text-sm text-gray-600">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() =>
                              setCurrentPage(p => Math.min(totalPages, p + 1))
                            }
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // ======== VUE CARTE ========
              <MapLibreMapView
                organisations={filteredOrganisations}
                height={400}
                onMarkerClick={handleMarkerClick}
              />
            )}
          </div>

          {/* ---- FOOTER ---- */}
          <DialogFooter className="flex items-center justify-between gap-4 border-t pt-4">
            <div className="flex-1 min-w-0">
              {pendingOrg ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    <span className="font-medium">
                      {pendingOrg.trade_name ?? pendingOrg.legal_name}
                    </span>
                    {pendingOrg.city && (
                      <span className="text-gray-500">
                        {' '}
                        ({pendingOrg.city})
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">
                  Cliquez sur un restaurant pour le sélectionner
                </span>
              )}
            </div>
            <Button onClick={handleConfirm} disabled={!pendingOrg}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
