'use client';

/**
 * OrganisationPickerModal — Modal générique de sélection d'organisation
 *
 * Extrait de RestaurantSelectorModal (apps/linkme) pour usage cross-app.
 * Features :
 * - Searchbar fuzzy : trade_name, legal_name, city, address_line1
 * - Grille de cartes avec logo + badge ownership
 * - Tabs filtres Tous / Propres / Franchises (optionnel)
 * - Pagination 9 items/page
 * - Click carte → onSelect(org) + fermeture modal
 *
 * @module OrganisationPickerModal
 * @since 2026-04-19
 */

import { useState, useMemo, useCallback } from 'react';

import {
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { OrganisationLogo } from '../display/OrganisationLogo';

// =====================================================================
// TYPES
// =====================================================================

export interface OrganisationPickerItem {
  id: string;
  legal_name: string;
  trade_name: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  shipping_address_line1?: string | null;
  logo_url: string | null;
  ownership_type: string | null;
}

export interface OrganisationPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisations: OrganisationPickerItem[];
  selectedId: string | null;
  onSelect: (org: OrganisationPickerItem) => void;
  title?: string;
  description?: string;
  showOwnershipFilter?: boolean;
  emptyMessage?: string;
}

type TabFilter = 'all' | 'succursale' | 'franchise';

const ITEMS_PER_PAGE = 9;

// =====================================================================
// HELPERS
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
// COMPOSANT
// =====================================================================

export function OrganisationPickerModal({
  open,
  onOpenChange,
  organisations,
  selectedId,
  onSelect,
  title = 'Sélectionner une organisation',
  description,
  showOwnershipFilter = false,
  emptyMessage = 'Aucune organisation trouvée',
}: OrganisationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Filtrage ----
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

  const handleCardClick = useCallback(
    (org: OrganisationPickerItem) => {
      onSelect(org);
      onOpenChange(false);
      // Reset état interne
      setSearchQuery('');
      setActiveTab('all');
      setCurrentPage(1);
    },
    [onSelect, onOpenChange]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setSearchQuery('');
        setActiveTab('all');
        setCurrentPage(1);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: tabStats.all },
    { id: 'succursale', label: 'Propres', count: tabStats.succursale },
    { id: 'franchise', label: 'Franchises', count: tabStats.franchise },
  ];

  const resolvedDescription =
    description ??
    `${organisations.length.toString()} organisation${organisations.length > 1 ? 's' : ''} disponible${organisations.length > 1 ? 's' : ''}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dialogSize="xl" className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>

          {/* Barre de recherche */}
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

        {/* Tabs filtres ownership (optionnel) */}
        {showOwnershipFilter && (
          <div className="flex items-center gap-1 px-1">
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

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto min-h-0">
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
                {/* Grille 3 colonnes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paginatedOrganisations.map(org => {
                    const badge = getOwnershipBadge(org.ownership_type);
                    const isSelected = selectedId === org.id;
                    const displayName = org.trade_name ?? org.legal_name;
                    const addressLine =
                      org.shipping_address_line1 ??
                      org.address_line1 ??
                      'Adresse non renseignée';

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
                                {addressLine}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {[org.postal_code, org.city]
                                  .filter(Boolean)
                                  .join(' ')}
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
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
        </div>

        <DialogFooter className="border-t pt-4">
          <p className="text-sm text-gray-400 flex-1">
            Cliquez sur une organisation pour la sélectionner
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
