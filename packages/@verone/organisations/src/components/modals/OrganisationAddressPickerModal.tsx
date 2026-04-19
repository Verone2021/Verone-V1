'use client';

/**
 * OrganisationAddressPickerModal — Modal professionnel de sélection organisation
 *
 * Déplacé depuis apps/linkme RestaurantSelectorModal (526 lignes, complet).
 * Rendu générique pour usage cross-app (back-office devis + LinkMe commandes).
 *
 * Features :
 * - Trigger button inline (affiche l'org sélectionnée avec logo + badge)
 * - Searchbar fuzzy : trade_name, legal_name, city, address
 * - Tabs filtres Tous / Propres / Franchises (via showOwnershipFilter)
 * - Vue Liste grille paginée (9 items/page)
 * - Vue Carte MapLibre (via showMapView)
 * - Sélection pending → confirmation
 *
 * @module OrganisationAddressPickerModal
 * @since 2026-04-17
 */

import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback } from 'react';

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

import { OrganisationLogo } from '../display/OrganisationLogo';
import type { MapOrganisation } from '../maps/MapLibreMapView';

// Import dynamique de la carte (SSR désactivé — maplibre-gl est browser-only)
const MapLibreMapView = dynamic(
  () => import('../maps/MapLibreMapView').then(m => m.MapLibreMapView),
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

export interface OrganisationListItem {
  id: string;
  legal_name: string;
  trade_name: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  shipping_address_line1?: string | null;
  logo_url: string | null;
  ownership_type: string | null;
  /** Coordonnées GPS — obligatoires uniquement si showMapView=true */
  latitude?: number | null;
  longitude?: number | null;
}

export interface OrganisationAddressPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisations: OrganisationListItem[];
  selectedId: string | null;
  onSelect: (org: OrganisationListItem) => void;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  /** Affiche le toggle Liste/Carte — default false */
  showMapView?: boolean;
  /** Affiche les tabs filtres Tous/Propres/Franchises — default false */
  showOwnershipFilter?: boolean;
  emptyMessage?: string;
  /**
   * Masque le trigger button inline.
   * Utile quand le parent gère son propre bouton d'ouverture (ex: QuoteShippingSection).
   * Default false.
   */
  hideTrigger?: boolean;
}

type TabFilter = 'all' | 'succursale' | 'franchise';
type ViewMode = 'list' | 'map';

const ITEMS_PER_PAGE = 9;

// =====================================================================
// HELPER
// =====================================================================

export function getOwnershipBadge(
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
// SUB-COMPONENTS
// =====================================================================

interface OrgCardProps {
  org: OrganisationListItem;
  isSelected: boolean;
  onClick: (org: OrganisationListItem) => void;
}

function OrgCard({ org, isSelected, onClick }: OrgCardProps) {
  const badge = getOwnershipBadge(org.ownership_type);
  const displayName = org.trade_name ?? org.legal_name;
  const addressLine =
    org.shipping_address_line1 ?? org.address_line1 ?? 'Adresse non renseignée';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50'
      )}
      onClick={() => onClick(org)}
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
            <p className="text-xs text-gray-500 mt-1 truncate">{addressLine}</p>
            <p className="text-xs text-gray-400 truncate">
              {[org.postal_code, org.city].filter(Boolean).join(' ')}
            </p>
          </div>
          {isSelected && (
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PaginationBarProps {
  total: number;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

function PaginationBar({
  total,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-gray-500">
        {total} résultat{total > 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={onPrev}
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
          onClick={onNext}
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function OrganisationAddressPickerModal({
  open,
  onOpenChange,
  organisations,
  selectedId,
  onSelect,
  isLoading = false,
  error,
  title = 'Sélectionner une organisation',
  description,
  showMapView = false,
  showOwnershipFilter = false,
  emptyMessage = 'Aucune organisation trouvée',
  hideTrigger = false,
}: OrganisationAddressPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingOrg, setPendingOrg] = useState<OrganisationListItem | null>(
    null
  );

  const selectedOrg = useMemo(
    () => organisations.find(o => o.id === selectedId) ?? null,
    [organisations, selectedId]
  );

  const filteredOrganisations = useMemo(() => {
    let filtered = organisations;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        org =>
          (org.trade_name ?? '').toLowerCase().includes(query) ||
          org.legal_name.toLowerCase().includes(query) ||
          (org.city ?? '').toLowerCase().includes(query) ||
          (org.address_line1 ?? '').toLowerCase().includes(query) ||
          (org.shipping_address_line1 ?? '').toLowerCase().includes(query)
      );
    }
    if (activeTab !== 'all') {
      filtered = filtered.filter(org => org.ownership_type === activeTab);
    }
    return filtered;
  }, [organisations, searchQuery, activeTab]);

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

  const totalPages = Math.ceil(filteredOrganisations.length / ITEMS_PER_PAGE);
  const paginatedOrganisations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrganisations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrganisations, currentPage]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tab: TabFilter) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleCardClick = useCallback((org: OrganisationListItem) => {
    setPendingOrg(org);
  }, []);

  const handleMarkerClick = useCallback(
    (mapOrg: MapOrganisation) => {
      const org = organisations.find(o => o.id === mapOrg.id);
      if (org) setPendingOrg(org);
    },
    [organisations]
  );

  const handleConfirm = useCallback(() => {
    if (pendingOrg) {
      onSelect(pendingOrg);
      onOpenChange(false);
      setPendingOrg(null);
      setSearchQuery('');
      setActiveTab('all');
      setCurrentPage(1);
    }
  }, [pendingOrg, onSelect, onOpenChange]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      onOpenChange(isOpen);
      if (isOpen) {
        setSearchQuery('');
        setActiveTab('all');
        setCurrentPage(1);
        setPendingOrg(selectedOrg);
      }
    },
    [onOpenChange, selectedOrg]
  );

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: tabStats.all },
    { id: 'succursale', label: 'Propres', count: tabStats.succursale },
    { id: 'franchise', label: 'Franchises', count: tabStats.franchise },
  ];

  const resolvedDescription =
    description ??
    `${organisations.length.toString()} organisation${organisations.length > 1 ? 's' : ''} disponible${organisations.length > 1 ? 's' : ''}`;

  // ---- Trigger button ----
  const triggerButton = (
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
          <span className="text-sm text-gray-500">Chargement...</span>
        </>
      ) : selectedOrg ? (
        <>
          <OrganisationLogo
            logoUrl={selectedOrg.logo_url}
            organisationName={selectedOrg.trade_name ?? selectedOrg.legal_name}
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
          <span className="text-sm text-gray-500">
            Sélectionner une organisation
          </span>
        </>
      )}
    </button>
  );

  // ---- Map organisations cast ----
  const mapOrganisations: MapOrganisation[] = filteredOrganisations.map(o => ({
    id: o.id,
    trade_name: o.trade_name,
    legal_name: o.legal_name,
    city: o.city,
    postal_code: o.postal_code,
    shipping_address_line1: o.shipping_address_line1 ?? null,
    shipping_city: null,
    shipping_postal_code: null,
    logo_url: o.logo_url,
    latitude: o.latitude ?? null,
    longitude: o.longitude ?? null,
    ownership_type:
      (o.ownership_type as MapOrganisation['ownership_type']) ?? null,
  }));

  return (
    <>
      {!hideTrigger && triggerButton}
      {!hideTrigger && error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent dialogSize="xl" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{resolvedDescription}</DialogDescription>

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

          {/* Toggle vue + Tabs */}
          <div className="flex items-center justify-between gap-4 px-1">
            {showMapView && (
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
            )}

            {showOwnershipFilter && viewMode === 'list' && (
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

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {viewMode === 'list' ? (
              <div className="space-y-4">
                {filteredOrganisations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Store className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">{emptyMessage}</p>
                    {searchQuery.trim() && (
                      <p className="text-sm mt-1">
                        Essayez un autre terme de recherche
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paginatedOrganisations.map(org => (
                        <OrgCard
                          key={org.id}
                          org={org}
                          isSelected={pendingOrg?.id === org.id}
                          onClick={handleCardClick}
                        />
                      ))}
                    </div>
                    <PaginationBar
                      total={filteredOrganisations.length}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
                      onNext={() =>
                        setCurrentPage(p => Math.min(totalPages, p + 1))
                      }
                    />
                  </>
                )}
              </div>
            ) : (
              <MapLibreMapView
                organisations={mapOrganisations}
                height={400}
                onMarkerClick={handleMarkerClick}
              />
            )}
          </div>

          {/* Footer */}
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
                  Cliquez sur une organisation pour la sélectionner
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
