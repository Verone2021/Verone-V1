'use client';

import { useState, useMemo, useEffect } from 'react';

import Link from 'next/link';

import { useLocalStorage } from '@verone/hooks';
import { OrganisationLogo } from '@verone/organisations';
import { ConfirmDeleteOrganisationModal } from '@verone/organisations';
import { PartnerFormModal } from '@verone/organisations';
import {
  useOrganisations,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2, IconButton } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
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
  Archive,
  Trash2,
  ArchiveRestore,
  ArrowLeft,
  ExternalLink,
  Building2,
  Eye,
  LayoutGrid,
  List,
} from 'lucide-react';

import { FavoriteToggleButton } from '@/components/business/favorite-toggle-button';

// ✅ FIX TypeScript: Utiliser type Organisation (pas de Partner local)
// Interface Organisation définie dans use-organisations.ts

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'active' | 'archived' | 'preferred'
  >('active');
  const [archivedPartners, setArchivedPartners] = useState<Organisation[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<
    Organisation | null | undefined
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'partners-view-mode',
    'grid'
  );
  const [deleteModalPartner, setDeleteModalPartner] =
    useState<Organisation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 12; // 3 lignes × 4 colonnes

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  // Utiliser useMemo pour stabiliser l'objet filters et éviter la boucle infinie
  // Prestataires = type supplier avec is_service_provider = true
  const filters = useMemo(
    () => ({
      type: 'supplier' as const,
      is_service_provider: true, // Prestataires uniquement
      is_active: true,
      search: searchQuery ?? undefined,
    }),
    [searchQuery]
  );

  const {
    organisations: partners,
    loading,
    error: _error,
    toggleOrganisationStatus: _toggleOrganisationStatus,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch,
  } = useOrganisations(filters);

  const handleArchive = async (partner: Organisation) => {
    if (!partner.archived_at) {
      // Archiver
      const success = await archiveOrganisation(partner.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Partners] Refetch after archive failed:', error);
        });
        if (activeTab === 'archived') {
          await loadArchivedPartnersData();
        }
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(partner.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Partners] Refetch after unarchive failed:', error);
        });
        await loadArchivedPartnersData();
      }
    }
  };

  const handleDelete = (partner: Organisation) => {
    setDeleteModalPartner(partner);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalPartner) return;

    setIsDeleting(true);
    try {
      const success = await hardDeleteOrganisation(deleteModalPartner.id);
      if (success) {
        await loadArchivedPartnersData();
        setDeleteModalPartner(null); // Fermer le modal
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreatePartner = () => {
    setSelectedPartner(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPartner(null);
  };

  const handlePartnerSuccess = () => {
    void refetch().catch(error => {
      console.error('[Partners] Refetch failed:', error);
    });
    handleCloseModal();
  };

  const loadArchivedPartnersData = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('type', 'partner')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
        .returns<Organisation[]>();

      if (error) throw error;
      setArchivedPartners(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        '[Partners] Erreur chargement partenaires archivés:',
        message
      );
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedPartnersData().catch(error => {
        console.error('[Partners] Load archived data failed:', error);
      });
    }
  }, [activeTab]);

  // Filtrage selon l'onglet actif
  const displayedPartners = useMemo(() => {
    if (activeTab === 'active') {
      return partners;
    } else if (activeTab === 'archived') {
      return archivedPartners;
    } else if (activeTab === 'preferred') {
      return partners.filter(p => p.preferred_supplier === true);
    }
    return partners;
  }, [activeTab, partners, archivedPartners]);

  // Pagination
  const paginatedPartners = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedPartners.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedPartners, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayedPartners.length / itemsPerPage);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = partners.length;
    const active = partners.filter(p => p.is_active).length;
    const archived = archivedPartners.length;
    const favorites = partners.filter(
      p => p.preferred_supplier === true
    ).length;

    return { total, active, archived, favorites };
  }, [partners, archivedPartners]);

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
            Partenaires
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Gestion du réseau de partenaires et distributeurs commerciaux
          </p>
        </div>
        <ButtonV2 variant="primary" onClick={handleCreatePartner} icon={Plus}>
          Nouveau Partenaire
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
              Total partenaires
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
          <span className="ml-2 opacity-70">({partners.length})</span>
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
          <span className="ml-2 opacity-70">({archivedPartners.length})</span>
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
            ({partners.filter(p => p.preferred_supplier === true).length})
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

      {/* Partners Grid OU List View */}
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
            : paginatedPartners.map(partner => (
                <Card
                  key={partner.id}
                  className="hover:shadow-lg transition-all duration-200"
                  data-testid="partner-card"
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
                          logoUrl={partner.logo_url}
                          organisationName={getOrganisationDisplayName(partner)}
                          size="md"
                          fallback="initials"
                        />
                      </div>

                      {/* Contenu DROITE - Stack vertical avec hauteurs fixes */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Ligne 1: Nom (toujours 2 lignes réservées) + Badge Archivé */}
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] flex-1">
                            {partner.website ? (
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                style={{ color: colors.text.DEFAULT }}
                                data-testid="partner-name"
                              >
                                {getOrganisationDisplayName(partner)}
                              </a>
                            ) : (
                              <span
                                style={{ color: colors.text.DEFAULT }}
                                data-testid="partner-name"
                              >
                                {getOrganisationDisplayName(partner)}
                              </span>
                            )}
                          </CardTitle>

                          {/* Badge Archivé seulement */}
                          {partner.archived_at && (
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
                          {partner.billing_address_line1 && (
                            <div
                              className="flex items-center gap-1.5 text-xs"
                              style={{ color: colors.text.subtle }}
                            >
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate line-clamp-1">
                                {partner.billing_address_line1}
                              </span>
                            </div>
                          )}
                          {}
                          {(!!partner.billing_postal_code ||
                            !!partner.billing_city) && (
                            <div
                              className="text-xs pl-[18px]"
                              style={{ color: colors.text.subtle }}
                            >
                              <span className="truncate line-clamp-1">
                                {partner.billing_postal_code &&
                                  `${partner.billing_postal_code}, `}
                                {partner.billing_city}
                              </span>
                            </div>
                          )}
                          {partner.billing_country && (
                            <div
                              className="text-xs pl-[18px]"
                              style={{ color: colors.text.subtle }}
                            >
                              <span className="truncate line-clamp-1">
                                {partner.billing_country}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Boutons - Toujours en bas avec mt-auto */}
                        <div
                          className="mt-auto pt-4 border-t"
                          style={{ borderColor: colors.border.DEFAULT }}
                        >
                          <div className="flex items-center gap-1">
                            {activeTab === 'active' ||
                            activeTab === 'preferred' ? (
                              <>
                                <FavoriteToggleButton
                                  organisationId={partner.id}
                                  isFavorite={
                                    partner.preferred_supplier === true
                                  }
                                  organisationType="partner"
                                  disabled={!partner.is_active}
                                  onToggleComplete={() => {
                                    void refetch().catch(error => {
                                      console.error(
                                        '[Partners] Refetch after favorite toggle failed:',
                                        error
                                      );
                                    });
                                    void loadArchivedPartnersData().catch(
                                      error => {
                                        console.error(
                                          '[Partners] Load archived after favorite toggle failed:',
                                          error
                                        );
                                      }
                                    );
                                  }}
                                  className="h-7 px-2"
                                />
                                <Link
                                  href={`/contacts-organisations/partners/${partner.id}`}
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
                                    void handleArchive(partner).catch(error => {
                                      console.error(
                                        '[Partners] Archive action failed:',
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
                                  organisationId={partner.id}
                                  isFavorite={
                                    partner.preferred_supplier === true
                                  }
                                  organisationType="partner"
                                  disabled={!partner.is_active}
                                  onToggleComplete={() => {
                                    void refetch().catch(error => {
                                      console.error(
                                        '[Partners] Refetch after favorite toggle failed:',
                                        error
                                      );
                                    });
                                    void loadArchivedPartnersData().catch(
                                      error => {
                                        console.error(
                                          '[Partners] Load archived after favorite toggle failed:',
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
                                    void handleArchive(partner).catch(error => {
                                      console.error(
                                        '[Partners] Archive action failed:',
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
                                  onClick={() => handleDelete(partner)}
                                  icon={Trash2}
                                  label="Supprimer"
                                />
                                <Link
                                  href={`/contacts-organisations/partners/${partner.id}`}
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
                  Partenaire
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
                : paginatedPartners.map(partner => (
                    <TableRow key={partner.id} className="hover:bg-muted/50">
                      {/* Logo + Nom avec lien site web */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <OrganisationLogo
                            logoUrl={partner.logo_url}
                            organisationName={getOrganisationDisplayName(
                              partner
                            )}
                            size="sm"
                            fallback="initials"
                          />
                          <div>
                            {partner.website ? (
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline flex items-center gap-1"
                                style={{ color: colors.text.DEFAULT }}
                              >
                                {getOrganisationDisplayName(partner)}
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
                                {getOrganisationDisplayName(partner)}
                              </span>
                            )}
                            {partner.archived_at && (
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
                          {partner.billing_address_line1 && (
                            <div>{partner.billing_address_line1}</div>
                          )}
                          {}
                          {(!!partner.billing_postal_code ||
                            !!partner.billing_city) && (
                            <div>
                              {partner.billing_postal_code &&
                                `${partner.billing_postal_code}, `}
                              {partner.billing_city}
                            </div>
                          )}
                          {partner.billing_country && (
                            <div>{partner.billing_country}</div>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          {activeTab === 'active' ||
                          activeTab === 'preferred' ? (
                            <>
                              <FavoriteToggleButton
                                organisationId={partner.id}
                                isFavorite={partner.preferred_supplier === true}
                                organisationType="partner"
                                disabled={!partner.is_active}
                                onToggleComplete={() => {
                                  void refetch().catch(error => {
                                    console.error(
                                      '[Partners] Refetch after favorite toggle failed:',
                                      error
                                    );
                                  });
                                  void loadArchivedPartnersData().catch(
                                    error => {
                                      console.error(
                                        '[Partners] Load archived after favorite toggle failed:',
                                        error
                                      );
                                    }
                                  );
                                }}
                                className="h-7 px-2"
                              />
                              <Link
                                href={`/contacts-organisations/partners/${partner.id}`}
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
                                  void handleArchive(partner).catch(error => {
                                    console.error(
                                      '[Partners] Archive action failed:',
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
                                organisationId={partner.id}
                                isFavorite={partner.preferred_supplier === true}
                                organisationType="partner"
                                disabled={!partner.is_active}
                                onToggleComplete={() => {
                                  void refetch().catch(error => {
                                    console.error(
                                      '[Partners] Refetch after favorite toggle failed:',
                                      error
                                    );
                                  });
                                  void loadArchivedPartnersData().catch(
                                    error => {
                                      console.error(
                                        '[Partners] Load archived after favorite toggle failed:',
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
                                  void handleArchive(partner).catch(error => {
                                    console.error(
                                      '[Partners] Archive action failed:',
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
                                onClick={() => handleDelete(partner)}
                                icon={Trash2}
                                label="Supprimer"
                              />
                              <Link
                                href={`/contacts-organisations/partners/${partner.id}`}
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
      {totalPages > 1 && !isLoading && paginatedPartners.length > 0 && (
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

      {displayedPartners.length === 0 && !isLoading && (
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
              Aucun partenaire trouvé
            </h3>
            <p className="mb-4" style={{ color: colors.text.subtle }}>
              {searchQuery
                ? 'Aucun partenaire ne correspond à votre recherche.'
                : activeTab === 'active'
                  ? 'Commencez par créer votre premier partenaire.'
                  : 'Aucun partenaire archivé.'}
            </p>
            {activeTab === 'active' && (
              <ButtonV2
                variant="primary"
                onClick={handleCreatePartner}
                icon={Plus}
              >
                Créer un partenaire
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      )}

      <PartnerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        partner={selectedPartner ?? undefined}
        onSuccess={handlePartnerSuccess}
      />

      <ConfirmDeleteOrganisationModal
        open={!!deleteModalPartner}
        onOpenChange={open => !open && setDeleteModalPartner(null)}
        organisation={deleteModalPartner}
        organisationType="partner"
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
