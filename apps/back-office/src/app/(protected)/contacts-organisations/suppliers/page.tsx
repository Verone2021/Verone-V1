'use client';

import { useState, useMemo, useEffect } from 'react';

import Link from 'next/link';

import { useLocalStorage } from '@verone/hooks';
import { OrganisationLogo } from '@verone/organisations';
import { ConfirmDeleteOrganisationModal } from '@verone/organisations';
import { SupplierFormModal } from '@verone/organisations';
import {
  useSuppliers,
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ButtonV2, IconButton } from '@verone/ui';
import { Badge } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Plus,
  Building2,
  MapPin,
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Trash2,
  ExternalLink,
  Eye,
  Package,
  LayoutGrid,
  List,
} from 'lucide-react';

import { FavoriteToggleButton } from '@/components/business/favorite-toggle-button';

// ✅ FIX TypeScript: Utiliser type Organisation (pas de Supplier local)
// Interface Organisation définie dans use-organisations.ts

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'active' | 'archived' | 'preferred'
  >('active');
  const [archivedSuppliers, setArchivedSuppliers] = useState<Organisation[]>(
    []
  );
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Organisation | null>(
    null
  );
  const [deleteModalSupplier, setDeleteModalSupplier] =
    useState<Organisation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'suppliers-view-mode',
    'grid'
  );
  const itemsPerPage = 12; // 3 lignes × 4 colonnes

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const filters = useMemo(
    () => ({
      is_active: true,
      is_service_provider: false, // Fournisseurs uniquement (pas les prestataires)
      search: searchQuery ?? undefined,
    }),
    [searchQuery]
  );

  const {
    organisations: suppliers,
    loading,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch,
  } = useSuppliers(filters);

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleSupplierSuccess = () => {
    void refetch().catch(error => {
      console.error('[Suppliers] Refetch failed:', error);
    });
    handleCloseModal();
  };

  const loadArchivedSuppliersData = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('type', 'supplier')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
        .returns<Organisation[]>();

      if (error) throw error;

      // Comptage des produits pour chaque fournisseur (même approche que useOrganisations)
      let organisationsWithCounts = data ?? [];

      if ((data ?? []).length > 0) {
        const supplierIds = data.map(s => s.id);

        // Requête groupée pour compter les produits par supplier_id
        const { data: productCounts } = await supabase
          .from('products')
          .select('supplier_id')
          .in('supplier_id', supplierIds)
          .returns<{ supplier_id: string | null }[]>();

        // Créer un Map de comptage
        const countsMap = new Map<string, number>();
        productCounts?.forEach(p => {
          if (!p.supplier_id) return;
          const count = countsMap.get(p.supplier_id) ?? 0;
          countsMap.set(p.supplier_id, count + 1);
        });

        // Merger les comptes avec les organisations + ajouter le champ 'name'
        organisationsWithCounts = (data ?? []).map(org => ({
          ...org,
          name: org.trade_name ?? org.legal_name,
          _count: {
            products: countsMap.get(org.id) ?? 0,
          },
        })) as Organisation[];
      } else {
        // Ajouter le champ 'name' même sans comptage
        organisationsWithCounts = (data ?? []).map(org => ({
          ...org,
          name: org.trade_name ?? org.legal_name,
        })) as Organisation[];
      }

      setArchivedSuppliers(organisationsWithCounts);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        '[Suppliers] Erreur chargement fournisseurs archivés:',
        message
      );
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedSuppliersData().catch(error => {
        console.error('[Suppliers] Load archived data failed:', error);
      });
    }
  }, [activeTab]);

  const handleArchive = async (supplier: Organisation) => {
    if (!supplier.archived_at) {
      const success = await archiveOrganisation(supplier.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Suppliers] Refetch after archive failed:', error);
        });
        if (activeTab === 'archived') {
          await loadArchivedSuppliersData();
        }
      }
    } else {
      const success = await unarchiveOrganisation(supplier.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Suppliers] Refetch after unarchive failed:', error);
        });
        await loadArchivedSuppliersData();
      }
    }
  };

  const handleDelete = (supplier: Organisation) => {
    setDeleteModalSupplier(supplier);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalSupplier) return;

    setIsDeleting(true);
    try {
      const success = await hardDeleteOrganisation(deleteModalSupplier.id);
      if (success) {
        await loadArchivedSuppliersData();
        setDeleteModalSupplier(null); // Fermer le modal
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage selon l'onglet actif
  const displayedSuppliers = useMemo(() => {
    if (activeTab === 'active') {
      return suppliers;
    } else if (activeTab === 'archived') {
      return archivedSuppliers;
    } else if (activeTab === 'preferred') {
      return suppliers.filter(s => s.preferred_supplier === true);
    }
    return suppliers;
  }, [activeTab, suppliers, archivedSuppliers]);

  // Pagination
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedSuppliers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayedSuppliers.length / itemsPerPage);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.is_active).length;
    const archived = archivedSuppliers.length;
    const favorites = suppliers.filter(
      s => s.preferred_supplier === true
    ).length;

    return { total, active, archived, favorites };
  }, [suppliers, archivedSuppliers]);

  // Reset page quand recherche ou tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const isLoading =
    activeTab === 'active' || activeTab === 'preferred'
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
            Fournisseurs
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Gestion des fournisseurs et partenaires commerciaux
          </p>
        </div>
        <ButtonV2 variant="primary" onClick={handleCreateSupplier} icon={Plus}>
          Nouveau Fournisseur
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
              Total fournisseurs
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
              {stats.archived}
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
          <span className="ml-2 opacity-70">({suppliers.length})</span>
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
          <span className="ml-2 opacity-70">({archivedSuppliers.length})</span>
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
            ({suppliers.filter(s => s.preferred_supplier === true).length})
          </span>
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

      {/* Suppliers Grid OU List View */}
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
            : paginatedSuppliers.map(supplier => (
                <Card
                  key={supplier.id}
                  className="hover:shadow-lg transition-all duration-200"
                  data-testid="supplier-card"
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
                          logoUrl={supplier.logo_url}
                          organisationName={getOrganisationDisplayName(
                            supplier
                          )}
                          size="md"
                          fallback="initials"
                        />
                      </div>

                      {/* Contenu DROITE - Stack vertical avec hauteurs fixes */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Ligne 1: Nom (toujours 2 lignes réservées) + Badge Archivé */}
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

                          {/* Badge Archivé seulement */}
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

                        {/* Adresse de facturation - Espace réservé même si vide */}
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
                          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Intentional boolean OR */}
                          {(supplier.billing_postal_code ||
                            supplier.billing_city) && (
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

                        {/* COMPTEUR PRODUITS - SPÉCIFIQUE SUPPLIERS */}
                        {/* ✅ FIX: Réserver hauteur fixe pour aligner les boutons */}
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

                        {/* Boutons - Pattern Catalogue IconButton */}
                        <div
                          className="mt-auto pt-4 border-t"
                          style={{ borderColor: colors.border.DEFAULT }}
                        >
                          <div className="flex items-center gap-1">
                            {activeTab === 'active' ||
                            activeTab === 'preferred' ? (
                              <>
                                <FavoriteToggleButton
                                  organisationId={supplier.id}
                                  isFavorite={
                                    supplier.preferred_supplier === true
                                  }
                                  organisationType="supplier"
                                  disabled={!supplier.is_active}
                                  onToggleComplete={() => {
                                    void refetch().catch(error => {
                                      console.error(
                                        '[Suppliers] Refetch after favorite toggle failed:',
                                        error
                                      );
                                    });
                                    void loadArchivedSuppliersData().catch(
                                      error => {
                                        console.error(
                                          '[Suppliers] Load archived after favorite toggle failed:',
                                          error
                                        );
                                      }
                                    );
                                  }}
                                  className="h-7 px-2"
                                />
                                <Link
                                  href={`/contacts-organisations/suppliers/${supplier.id}`}
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
                                    void handleArchive(supplier).catch(
                                      error => {
                                        console.error(
                                          '[Suppliers] Archive action failed:',
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
                                  organisationId={supplier.id}
                                  isFavorite={
                                    supplier.preferred_supplier === true
                                  }
                                  organisationType="supplier"
                                  disabled={!supplier.is_active}
                                  onToggleComplete={() => {
                                    void refetch().catch(error => {
                                      console.error(
                                        '[Suppliers] Refetch after favorite toggle failed:',
                                        error
                                      );
                                    });
                                    void loadArchivedSuppliersData().catch(
                                      error => {
                                        console.error(
                                          '[Suppliers] Load archived after favorite toggle failed:',
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
                                    void handleArchive(supplier).catch(
                                      error => {
                                        console.error(
                                          '[Suppliers] Archive action failed:',
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
                                  onClick={() => handleDelete(supplier)}
                                  icon={Trash2}
                                  label="Supprimer"
                                />
                                <Link
                                  href={`/contacts-organisations/suppliers/${supplier.id}`}
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
                : paginatedSuppliers.map(supplier => (
                    <TableRow key={supplier.id} className="hover:bg-muted/50">
                      {/* Logo + Nom avec lien site web */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <OrganisationLogo
                            logoUrl={supplier.logo_url}
                            organisationName={getOrganisationDisplayName(
                              supplier
                            )}
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
                          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Intentional boolean OR */}
                          {(supplier.billing_postal_code ||
                            supplier.billing_city) && (
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

                      {/* Actions - Pattern Catalogue IconButton */}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          {activeTab === 'active' ||
                          activeTab === 'preferred' ? (
                            <>
                              <FavoriteToggleButton
                                organisationId={supplier.id}
                                isFavorite={
                                  supplier.preferred_supplier === true
                                }
                                organisationType="supplier"
                                disabled={!supplier.is_active}
                                onToggleComplete={() => {
                                  void refetch().catch(error => {
                                    console.error(
                                      '[Suppliers] Refetch after favorite toggle failed:',
                                      error
                                    );
                                  });
                                  void loadArchivedSuppliersData().catch(
                                    error => {
                                      console.error(
                                        '[Suppliers] Load archived after favorite toggle failed:',
                                        error
                                      );
                                    }
                                  );
                                }}
                                className="h-7 px-2"
                              />
                              <Link
                                href={`/contacts-organisations/suppliers/${supplier.id}`}
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
                                  void handleArchive(supplier).catch(error => {
                                    console.error(
                                      '[Suppliers] Archive action failed:',
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
                                organisationId={supplier.id}
                                isFavorite={
                                  supplier.preferred_supplier === true
                                }
                                organisationType="supplier"
                                disabled={!supplier.is_active}
                                onToggleComplete={() => {
                                  void refetch().catch(error => {
                                    console.error(
                                      '[Suppliers] Refetch after favorite toggle failed:',
                                      error
                                    );
                                  });
                                  void loadArchivedSuppliersData().catch(
                                    error => {
                                      console.error(
                                        '[Suppliers] Load archived after favorite toggle failed:',
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
                                  void handleArchive(supplier).catch(error => {
                                    console.error(
                                      '[Suppliers] Archive action failed:',
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
                                onClick={() => handleDelete(supplier)}
                                icon={Trash2}
                                label="Supprimer"
                              />
                              <Link
                                href={`/contacts-organisations/suppliers/${supplier.id}`}
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
      {totalPages > 1 && !isLoading && paginatedSuppliers.length > 0 && (
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

      {displayedSuppliers.length === 0 && !isLoading && (
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
              Aucun fournisseur trouvé
            </h3>
            <p className="mb-4" style={{ color: colors.text.subtle }}>
              {searchQuery
                ? 'Aucun fournisseur ne correspond à votre recherche.'
                : activeTab === 'active'
                  ? 'Commencez par créer votre premier fournisseur.'
                  : 'Aucun fournisseur archivé.'}
            </p>
            {activeTab === 'active' && (
              <ButtonV2
                variant="primary"
                onClick={handleCreateSupplier}
                icon={Plus}
              >
                Créer un fournisseur
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      )}

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        supplier={selectedSupplier ?? undefined}
        onSuccess={handleSupplierSuccess}
      />

      <ConfirmDeleteOrganisationModal
        open={!!deleteModalSupplier}
        onOpenChange={open => !open && setDeleteModalSupplier(null)}
        organisation={deleteModalSupplier}
        organisationType="supplier"
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
