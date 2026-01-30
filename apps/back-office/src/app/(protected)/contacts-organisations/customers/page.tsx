'use client';

import { useState, useMemo, useEffect } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CustomerFormModal } from '@verone/customers';
import { useLocalStorage } from '@verone/hooks';
import { OrganisationLogo } from '@verone/organisations';
import { ConfirmDeleteOrganisationModal } from '@verone/organisations';
import {
  useOrganisations,
  getOrganisationDisplayName,
  useActiveEnseignes,
  type Organisation,
} from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2, IconButton } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Plus,
  MapPin,
  Eye,
  Building2,
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Trash2,
  ExternalLink,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';

import { FavoriteToggleButton } from '@/components/business/favorite-toggle-button';

// ✅ FIX TypeScript: Utiliser type Organisation (pas de Customer local)
// Interface Organisation définie dans use-organisations.ts

// Composant pour afficher les badges de champs manquants
const MissingFieldsBadges = ({ customer }: { customer: Organisation }) => {
  const missing: string[] = [];
  if (
    !customer.billing_address_line1 ||
    !customer.billing_postal_code ||
    !customer.billing_city
  ) {
    missing.push('Adresse');
  }
  if (!customer.ownership_type) {
    missing.push('Type');
  }
  if (customer.ownership_type === 'franchise' && !customer.siren) {
    missing.push('SIREN');
  }

  if (missing.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {missing.map(field => (
        <Badge
          key={field}
          variant="outline"
          className="text-xs text-orange-600 border-orange-300 bg-orange-50"
        >
          {field} manquant
        </Badge>
      ))}
    </div>
  );
};

// Helper pour obtenir le badge ownership_type (design LinkMe)
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

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const urlType = searchParams.get('type') as
    | 'professional'
    | 'individual'
    | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'active' | 'archived' | 'preferred' | 'incomplete'
  >('active');
  const [archivedCustomers, setArchivedCustomers] = useState<Organisation[]>(
    []
  );
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Organisation | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'customers-view-mode',
    'grid'
  );
  const [deleteModalCustomer, setDeleteModalCustomer] =
    useState<Organisation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [enseigneFilter, setEnseigneFilter] = useState<string | null>(null);
  const { enseignes } = useActiveEnseignes();
  const itemsPerPage = 12; // 3 lignes × 4 colonnes

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const typeInfo = useMemo(() => {
    if (urlType === 'professional') {
      return {
        title: 'Clients Professionnels',
        description: 'Gestion des clients professionnels B2B',
        badgeText: 'Professionnels uniquement',
      };
    } else if (urlType === 'individual') {
      return {
        title: 'Clients Particuliers',
        description: 'Gestion des clients particuliers B2C',
        badgeText: 'Particuliers uniquement',
      };
    } else {
      return {
        title: 'Clients',
        description: 'Gestion de tous les clients',
        badgeText: null,
      };
    }
  }, [urlType]);

  const filters = useMemo(
    () => ({
      is_active: true,
      search: searchQuery ?? undefined,
      customer_type: urlType ?? undefined,
    }),
    [searchQuery, urlType]
  );

  const {
    organisations: customers,
    loading,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch,
  } = useOrganisations(filters);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    let result = customers.filter(customer => customer.type === 'customer');

    // Filtrer par enseigne si un filtre est actif
    if (enseigneFilter) {
      result = result.filter(
        customer => (customer as any).enseigne_id === enseigneFilter
      );
    }

    return result;
  }, [customers, enseigneFilter]);

  // Calcul des organisations incomplètes (critères: adresse, ownership_type, SIREN franchise)
  const incompleteCustomers = useMemo(() => {
    return filteredCustomers.filter(c => {
      const missingAddress =
        !c.billing_address_line1 || !c.billing_postal_code || !c.billing_city;
      const missingOwnershipType = !c.ownership_type;
      const franchiseMissingSiren =
        c.ownership_type === 'franchise' && !c.siren;

      return missingAddress || missingOwnershipType || franchiseMissingSiren;
    });
  }, [filteredCustomers]);

  const stats = useMemo(() => {
    const total = filteredCustomers.length;
    const active = filteredCustomers.filter(c => c.is_active).length;
    const favorites = filteredCustomers.filter(
      c => c.preferred_supplier === true
    ).length;
    const incomplete = incompleteCustomers.length;

    return { total, active, favorites, incomplete };
  }, [filteredCustomers, incompleteCustomers]);

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCustomerSuccess = () => {
    void refetch().catch(error => {
      console.error('[Customers] Refetch failed:', error);
    });
    handleCloseModal();
  };

  const loadArchivedCustomersData = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('type', 'customer')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedCustomers((data || []) as unknown as Organisation[]);
    } catch (err) {
      console.error('Erreur chargement clients archivés:', err);
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedCustomersData().catch(error => {
        console.error('[Customers] Load archived data failed:', error);
      });
    }
  }, [activeTab]);

  const handleArchive = async (customer: Organisation) => {
    if (!customer.archived_at) {
      const success = await archiveOrganisation(customer.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Customers] Refetch after archive failed:', error);
        });
        if (activeTab === 'archived') {
          await loadArchivedCustomersData();
        }
      }
    } else {
      const success = await unarchiveOrganisation(customer.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Customers] Refetch after unarchive failed:', error);
        });
        await loadArchivedCustomersData();
      }
    }
  };

  const handleDelete = (customer: Organisation) => {
    setDeleteModalCustomer(customer);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalCustomer) return;

    setIsDeleting(true);
    try {
      const success = await hardDeleteOrganisation(deleteModalCustomer.id);
      if (success) {
        await loadArchivedCustomersData();
        setDeleteModalCustomer(null); // Fermer le modal
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage selon l'onglet actif
  const displayedCustomers = useMemo(() => {
    if (activeTab === 'active') {
      return filteredCustomers;
    } else if (activeTab === 'archived') {
      return archivedCustomers;
    } else if (activeTab === 'preferred') {
      return filteredCustomers.filter(c => c.preferred_supplier === true);
    } else if (activeTab === 'incomplete') {
      return incompleteCustomers;
    }
    return filteredCustomers;
  }, [activeTab, filteredCustomers, archivedCustomers, incompleteCustomers]);

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayedCustomers.length / itemsPerPage);

  // Reset page quand recherche, tab ou filtre enseigne change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, enseigneFilter]);

  const isLoading =
    activeTab === 'active' ||
    activeTab === 'preferred' ||
    activeTab === 'incomplete'
      ? loading
      : archivedLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div
        className="flex justify-between items-start"
        style={{ marginBottom: spacing[6] }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations">
              <ButtonV2 variant="ghost" size="sm" icon={ArrowLeft}>
                Organisations
              </ButtonV2>
            </Link>
          </div>
          <h1
            className="text-3xl font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            {typeInfo.title}
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            {typeInfo.description}
          </p>
          {typeInfo.badgeText && (
            <div className="mt-2">
              <Badge
                variant="outline"
                style={{
                  backgroundColor: colors.primary[50],
                  color: colors.primary[700],
                  borderColor: colors.primary[200],
                }}
              >
                Filtré: {typeInfo.badgeText}
              </Badge>
            </div>
          )}
        </div>
        <ButtonV2 variant="primary" onClick={handleCreateCustomer} icon={Plus}>
          Nouveau Client
        </ButtonV2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.text.DEFAULT }}
            >
              {stats.total}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Total clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.success[500] }}
            >
              {stats.active}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Actifs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.text.DEFAULT }}
            >
              {archivedCustomers.length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Archivés
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.accent[500] }}
            >
              {stats.favorites}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Favoris
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Recherche */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'active'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Actifs
          <span className="ml-2 opacity-70">({filteredCustomers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'archived'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Archivés
          <span className="ml-2 opacity-70">({archivedCustomers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preferred')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'preferred'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Favoris
          <span className="ml-2 opacity-70">
            (
            {
              filteredCustomers.filter(c => c.preferred_supplier === true)
                .length
            }
            )
          </span>
        </button>

        <button
          onClick={() => setActiveTab('incomplete')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'incomplete'
              ? 'bg-orange-500 text-white'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          )}
        >
          À compléter
          <span className="ml-2 opacity-70">({stats.incomplete})</span>
        </button>

        {/* Barre de recherche alignée */}
        <div className="relative w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: colors.text.muted }}
          />
          <Input
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-lg"
            style={{
              borderColor: colors.border.DEFAULT,
              color: colors.text.DEFAULT,
            }}
          />
        </div>

        {/* Filtre par enseigne */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: colors.text.muted }} />
          <Select
            value={enseigneFilter || 'all'}
            onValueChange={value =>
              setEnseigneFilter(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="Toutes les enseignes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les enseignes</SelectItem>
              {enseignes.map(enseigne => (
                <SelectItem key={enseigne.id} value={enseigne.id}>
                  {enseigne.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggle Grid/List View */}
        <div className="flex gap-1 ml-auto">
          <ButtonV2
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('grid')}
            icon={LayoutGrid}
            className="h-10 px-3"
            aria-label="Vue grille"
          />
          <ButtonV2
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('list')}
            icon={List}
            className="h-10 px-3"
            aria-label="Vue liste"
          />
        </div>
      </div>

      {/* Customers Grid OU List View */}
      {viewMode === 'grid' ? (
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
            : paginatedCustomers.map(customer => (
                <Card
                  key={customer.id}
                  className="hover:shadow-lg transition-all duration-200"
                  data-testid="customer-card"
                >
                  <CardContent
                    className="flex flex-col h-full"
                    style={{ padding: spacing[3] }}
                  >
                    {/* Layout Horizontal Spacieux - Logo GAUCHE + Infos DROITE */}
                    <div className="flex gap-4">
                      {/* Logo GAUCHE - MD (48px) */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <OrganisationLogo
                          logoUrl={customer.logo_url}
                          organisationName={getOrganisationDisplayName(
                            customer
                          )}
                          size="md"
                          fallback="initials"
                        />
                      </div>

                      {/* Contenu DROITE - Stack vertical avec hauteurs fixes */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Ligne 1: Nom + Badge Archivé */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Nom du client */}
                            <CardTitle className="text-sm font-semibold line-clamp-2">
                              {customer.website ? (
                                <a
                                  href={customer.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                  style={{ color: colors.text.DEFAULT }}
                                  data-testid="customer-name"
                                >
                                  {getOrganisationDisplayName(customer)}
                                </a>
                              ) : (
                                <span
                                  style={{ color: colors.text.DEFAULT }}
                                  data-testid="customer-name"
                                >
                                  {getOrganisationDisplayName(customer)}
                                </span>
                              )}
                            </CardTitle>

                            {/* Badge Ownership Type en-dessous du nom, aligné à gauche */}
                            {(() => {
                              const badge = getOwnershipBadge(customer.ownership_type);
                              return badge ? (
                                <span className={cn("inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded", badge.className)}>
                                  {badge.label}
                                </span>
                              ) : null;
                            })()}
                          </div>

                          {/* Badge Archivé à droite */}
                          {customer.archived_at && (
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

                        {/* Adresse de facturation - Espace réservé même si vide */}
                        <div className="mt-3 min-h-[2.5rem] space-y-0.5">
                          {customer.billing_address_line1 && (
                            <div
                              className="flex items-center gap-1.5 text-xs"
                              style={{ color: colors.text.subtle }}
                            >
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate line-clamp-1">
                                {customer.billing_address_line1}
                              </span>
                            </div>
                          )}
                          {(customer.billing_postal_code ||
                            customer.billing_city) && (
                            <div
                              className="text-xs pl-[18px]"
                              style={{ color: colors.text.subtle }}
                            >
                              <span className="truncate line-clamp-1">
                                {customer.billing_postal_code &&
                                  `${customer.billing_postal_code}, `}
                                {customer.billing_city}
                              </span>
                            </div>
                          )}
                          {customer.billing_country && (
                            <div
                              className="text-xs pl-[18px]"
                              style={{ color: colors.text.subtle }}
                            >
                              <span className="truncate line-clamp-1">
                                {customer.billing_country}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Badges champs manquants - Visible uniquement onglet incomplete */}
                        {activeTab === 'incomplete' && (
                          <MissingFieldsBadges customer={customer} />
                        )}

                        {/* Boutons - Pattern Catalogue IconButton */}
                        <div
                          className="mt-auto pt-4 border-t"
                          style={{ borderColor: colors.border.DEFAULT }}
                        >
                          <div className="flex items-center gap-1">
                            {activeTab === 'active' ||
                            activeTab === 'preferred' ||
                            activeTab === 'incomplete' ? (
                              <>
                                <FavoriteToggleButton
                                  organisationId={customer.id}
                                  isFavorite={
                                    customer.preferred_supplier === true
                                  }
                                  organisationType="customer"
                                  disabled={!customer.is_active}
                                  onToggleComplete={() => {
                                    void refetch().catch(error => {
                                      console.error(
                                        '[Customers] Refetch after favorite toggle failed:',
                                        error
                                      );
                                    });
                                    void loadArchivedCustomersData().catch(
                                      error => {
                                        console.error(
                                          '[Customers] Load archived after favorite toggle failed:',
                                          error
                                        );
                                      }
                                    );
                                  }}
                                  className="h-7 px-2"
                                />
                                <Link
                                  href={`/contacts-organisations/customers/${customer.id}`}
                                >
                                  <IconButton
                                    variant="outline"
                                    size="sm"
                                    icon={Eye}
                                    label="Voir détails"
                                  />
                                </Link>
                                <IconButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    void handleArchive(customer).catch(
                                      error => {
                                        console.error(
                                          '[Customers] Archive action failed:',
                                          error
                                        );
                                      }
                                    );
                                  }}
                                  icon={Archive}
                                  label="Archiver"
                                />
                              </>
                            ) : (
                              <>
                                <FavoriteToggleButton
                                  organisationId={customer.id}
                                  isFavorite={
                                    customer.preferred_supplier === true
                                  }
                                  organisationType="customer"
                                  disabled={!customer.is_active}
                                  onToggleComplete={() => {
                                    void refetch().catch(error => {
                                      console.error(
                                        '[Customers] Refetch after favorite toggle failed:',
                                        error
                                      );
                                    });
                                    void loadArchivedCustomersData().catch(
                                      error => {
                                        console.error(
                                          '[Customers] Load archived after favorite toggle failed:',
                                          error
                                        );
                                      }
                                    );
                                  }}
                                  className="h-7 px-2"
                                />
                                <IconButton
                                  variant="success"
                                  size="sm"
                                  onClick={() => {
                                    void handleArchive(customer).catch(
                                      error => {
                                        console.error(
                                          '[Customers] Archive action failed:',
                                          error
                                        );
                                      }
                                    );
                                  }}
                                  icon={ArchiveRestore}
                                  label="Restaurer"
                                />
                                <IconButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDelete(customer)}
                                  icon={Trash2}
                                  label="Supprimer"
                                />
                                <Link
                                  href={`/contacts-organisations/customers/${customer.id}`}
                                >
                                  <IconButton
                                    variant="outline"
                                    size="sm"
                                    icon={Eye}
                                    label="Voir détails"
                                  />
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      ) : (
        /* Vue Liste */
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
                : paginatedCustomers.map(customer => (
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                      {/* Logo + Nom avec lien site web */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <OrganisationLogo
                            logoUrl={customer.logo_url}
                            organisationName={getOrganisationDisplayName(
                              customer
                            )}
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
                                {getOrganisationDisplayName(customer)}
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
                                {getOrganisationDisplayName(customer)}
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
                      <TableCell>
                        <div
                          className="text-sm"
                          style={{ color: colors.text.subtle }}
                        >
                          {customer.billing_address_line1 && (
                            <div>{customer.billing_address_line1}</div>
                          )}
                          {(customer.billing_postal_code ||
                            customer.billing_city) && (
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
                        <div className="flex justify-end items-center gap-1">
                          {activeTab === 'active' ||
                          activeTab === 'preferred' ? (
                            <>
                              <FavoriteToggleButton
                                organisationId={customer.id}
                                isFavorite={
                                  customer.preferred_supplier === true
                                }
                                organisationType="customer"
                                disabled={!customer.is_active}
                                onToggleComplete={() => {
                                  void refetch().catch(error => {
                                    console.error(
                                      '[Customers] Refetch after favorite toggle failed:',
                                      error
                                    );
                                  });
                                  void loadArchivedCustomersData().catch(
                                    error => {
                                      console.error(
                                        '[Customers] Load archived after favorite toggle failed:',
                                        error
                                      );
                                    }
                                  );
                                }}
                                className="h-7 px-2"
                              />
                              <Link
                                href={`/contacts-organisations/customers/${customer.id}`}
                              >
                                <IconButton
                                  variant="outline"
                                  size="sm"
                                  icon={Eye}
                                  label="Voir détails"
                                />
                              </Link>
                              <IconButton
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  void handleArchive(customer).catch(error => {
                                    console.error(
                                      '[Customers] Archive action failed:',
                                      error
                                    );
                                  });
                                }}
                                icon={Archive}
                                label="Archiver"
                              />
                            </>
                          ) : (
                            <>
                              <FavoriteToggleButton
                                organisationId={customer.id}
                                isFavorite={
                                  customer.preferred_supplier === true
                                }
                                organisationType="customer"
                                disabled={!customer.is_active}
                                onToggleComplete={() => {
                                  void refetch().catch(error => {
                                    console.error(
                                      '[Customers] Refetch after favorite toggle failed:',
                                      error
                                    );
                                  });
                                  void loadArchivedCustomersData().catch(
                                    error => {
                                      console.error(
                                        '[Customers] Load archived after favorite toggle failed:',
                                        error
                                      );
                                    }
                                  );
                                }}
                                className="h-7 px-2"
                              />
                              <IconButton
                                variant="success"
                                size="sm"
                                onClick={() => {
                                  void handleArchive(customer).catch(error => {
                                    console.error(
                                      '[Customers] Archive action failed:',
                                      error
                                    );
                                  });
                                }}
                                icon={ArchiveRestore}
                                label="Restaurer"
                              />
                              <IconButton
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(customer)}
                                icon={Trash2}
                                label="Supprimer"
                              />
                              <Link
                                href={`/contacts-organisations/customers/${customer.id}`}
                              >
                                <IconButton
                                  variant="outline"
                                  size="sm"
                                  icon={Eye}
                                  label="Voir détails"
                                />
                              </Link>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && paginatedCustomers.length > 0 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {displayedCustomers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center" style={{ padding: spacing[8] }}>
            <Building2
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: colors.text.muted }}
            />
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: colors.text.DEFAULT }}
            >
              Aucun client trouvé
            </h3>
            <p className="mb-4" style={{ color: colors.text.subtle }}>
              {searchQuery
                ? 'Aucun client ne correspond à votre recherche.'
                : activeTab === 'active'
                  ? 'Commencez par créer votre premier client.'
                  : 'Aucun client archivé.'}
            </p>
            {activeTab === 'active' && (
              <ButtonV2
                variant="primary"
                onClick={handleCreateCustomer}
                icon={Plus}
              >
                Créer un client
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      )}

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCustomerCreated={handleCustomerSuccess}
        onCustomerUpdated={handleCustomerSuccess}
        customer={selectedCustomer as any}
        mode={selectedCustomer ? 'edit' : 'create'}
      />

      <ConfirmDeleteOrganisationModal
        open={!!deleteModalCustomer}
        onOpenChange={open => !open && setDeleteModalCustomer(null)}
        organisation={deleteModalCustomer as any}
        organisationType="customer"
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
