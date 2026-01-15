'use client';

/**
 * Page Organisations LinkMe
 *
 * Gestion des organisations de l'enseigne avec vue cartes paginée
 * CRUD complet : Voir, Modifier, Archiver
 * Pagination pour performances (18 cartes par page)
 *
 * @module OrganisationsPage
 * @since 2026-01-10
 */

import { useEffect, useState, useMemo, Suspense } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { ConfirmDialog } from '@verone/ui';
import {
  Building2,
  ArrowLeft,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Store,
  Users,
} from 'lucide-react';

import {
  OrganisationCard,
  OrganisationDetailSheet,
  OrganisationActionsBar,
  OrganisationFilterTabs,
  QuickEditShippingAddressModal,
  QuickEditOwnershipTypeModal,
} from '../../../components/organisations';
import { useAuth } from '../../../contexts/AuthContext';
import { useArchiveOrganisation } from '../../../lib/hooks/use-archive-organisation';
import {
  useEnseigneOrganisations,
  type EnseigneOrganisation,
} from '../../../lib/hooks/use-enseigne-organisations';
import { useOrganisationStats } from '../../../lib/hooks/use-organisation-stats';
import { useUserAffiliate } from '../../../lib/hooks/use-user-selection';

// Import dynamique de la carte (SSR désactivé)
const MapLibreMapView = dynamic(
  () =>
    import('@/components/shared/MapLibreMapView').then(m => m.MapLibreMapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-gray-400">Chargement de la carte...</div>
      </div>
    ),
  }
);

// Configuration pagination
const ITEMS_PER_PAGE = 18; // 3 colonnes x 6 lignes

// Rôles autorisés à voir cette page
const ALLOWED_ROLES = ['enseigne_admin', 'organisation_admin'];

function OrganisationsPageContent(): JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, linkMeRole, loading, initializing } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  // Données
  const { data: organisations, isLoading: orgsLoading } =
    useEnseigneOrganisations(affiliate?.id ?? null);

  // Stats (CA, commissions) - utilise enseigne_id via affiliate
  const enseigneId = affiliate?.enseigne_id ?? null;
  const { data: statsMap } = useOrganisationStats(enseigneId);

  // Mutation archivage
  const { mutate: archiveOrg, isPending: isArchiving } =
    useArchiveOrganisation();

  // États locaux
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<
    'all' | 'succursale' | 'franchise' | 'incomplete' | 'map'
  >('all');
  const [detailSheetOrgId, setDetailSheetOrgId] = useState<string | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [orgToArchive, setOrgToArchive] = useState<EnseigneOrganisation | null>(
    null
  );
  const [highlightedOrgId, setHighlightedOrgId] = useState<string | null>(null);

  // State pour detail sheet depuis la carte (mode view)
  const [mapDetailSheetOrgId, setMapDetailSheetOrgId] = useState<string | null>(
    null
  );

  // Quick edit modals
  const [shippingAddressModalOrg, setShippingAddressModalOrg] =
    useState<EnseigneOrganisation | null>(null);
  const [ownershipTypeModalOrg, setOwnershipTypeModalOrg] =
    useState<EnseigneOrganisation | null>(null);

  // Gérer le paramètre ?highlight=org-id pour ouvrir automatiquement le DetailSheet
  useEffect(() => {
    const highlightParam = searchParams?.get('highlight');
    if (highlightParam && organisations) {
      // Vérifier que l'organisation existe
      const orgExists = organisations.some(org => org.id === highlightParam);
      if (orgExists) {
        setDetailSheetOrgId(highlightParam);
        setHighlightedOrgId(highlightParam);

        // Nettoyer l'URL après ouverture (sans recharger la page)
        const newUrl =
          window.location.pathname +
          window.location.search
            .replace(/[?&]highlight=[^&]+/, '')
            .replace(/^&/, '?');
        router.replace(
          newUrl === window.location.pathname + '?'
            ? window.location.pathname
            : newUrl
        );

        // Retirer le highlight visuel après 3 secondes
        setTimeout(() => {
          setHighlightedOrgId(null);
        }, 3000);
      }
    }
  }, [searchParams, organisations, router]);

  // Rediriger si non connecté
  useEffect(() => {
    if (!loading && !initializing && !user) {
      router.push('/login');
    }
  }, [user, loading, initializing, router]);

  // Rediriger si rôle non autorisé
  useEffect(() => {
    if (
      !loading &&
      !initializing &&
      linkMeRole &&
      !ALLOWED_ROLES.includes(linkMeRole.role)
    ) {
      router.push('/dashboard');
    }
  }, [linkMeRole, loading, initializing, router]);

  // Reset page quand la recherche ou le tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Stats par onglet
  const tabStats = useMemo(() => {
    if (!organisations)
      return { all: 0, succursale: 0, franchise: 0, incomplete: 0 };
    return {
      all: organisations.length,
      succursale: organisations.filter(o => o.ownership_type === 'succursale')
        .length,
      franchise: organisations.filter(o => o.ownership_type === 'franchise')
        .length,
      incomplete: organisations.filter(o => !o.ownership_type).length,
    };
  }, [organisations]);

  // Filtrer les organisations par recherche ET par onglet
  const filteredOrgs = useMemo(() => {
    if (!organisations) return [];

    // Filtre par onglet
    let filtered = organisations;
    if (activeTab === 'succursale') {
      filtered = organisations.filter(o => o.ownership_type === 'succursale');
    } else if (activeTab === 'franchise') {
      filtered = organisations.filter(o => o.ownership_type === 'franchise');
    } else if (activeTab === 'incomplete') {
      filtered = organisations.filter(o => !o.ownership_type);
    }

    // Filtre par recherche
    const searchLower = searchTerm.toLowerCase();
    return filtered.filter(
      org =>
        org.legal_name.toLowerCase().includes(searchLower) ||
        org.trade_name?.toLowerCase().includes(searchLower) ||
        org.city?.toLowerCase().includes(searchLower) ||
        org.shipping_city?.toLowerCase().includes(searchLower)
    );
  }, [organisations, searchTerm, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
  const paginatedOrgs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrgs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrgs, currentPage]);

  // Handlers
  const handleView = (org: EnseigneOrganisation): void => {
    setDetailSheetOrgId(org.id);
  };

  const handleEdit = (org: EnseigneOrganisation): void => {
    // Ouvrir le DetailSheet qui gère maintenant l'édition inline
    setDetailSheetOrgId(org.id);
  };

  const handleArchiveClick = (org: EnseigneOrganisation): void => {
    setOrgToArchive(org);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = (): void => {
    if (orgToArchive) {
      archiveOrg(orgToArchive.id);
      setArchiveDialogOpen(false);
      setOrgToArchive(null);
    }
  };

  const goToPage = (page: number): void => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Afficher loader pendant chargement
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Si pas d'utilisateur ou rôle non autorisé
  if (!user || (linkMeRole && !ALLOWED_ROLES.includes(linkMeRole.role))) {
    return null;
  }

  const isLoading = affiliateLoading || orgsLoading;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-linkme-turquoise" />
                Mes Organisations
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {linkMeRole?.enseigne_name && (
                  <span className="font-medium text-gray-600">
                    {linkMeRole.enseigne_name}
                  </span>
                )}
                {organisations && (
                  <span className="ml-2">
                    ({organisations.length} organisation
                    {organisations.length > 1 ? 's' : ''})
                  </span>
                )}
              </p>
            </div>

            {/* Barre d'actions */}
            <OrganisationActionsBar
              onNewOrganisation={() => {
                // TODO: Modal d'ajout
              }}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Onglets de filtrage par type */}
        <OrganisationFilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={tabStats}
        />

        {/* Barre de recherche + info pagination */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-linkme-turquoise focus:border-transparent"
            />
          </div>
          {filteredOrgs.length > 0 && (
            <div className="text-sm text-gray-500">
              Page {currentPage} / {totalPages}
            </div>
          )}
        </div>

        {/* Contenu principal : Carte ou Grille */}
        {activeTab === 'map' ? (
          /* Vue Carte */
          <>
            {/* KPI Cards pour la carte */}
            {organisations && organisations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">{organisations.length}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Propres</p>
                    <p className="text-2xl font-bold">
                      {
                        organisations.filter(
                          o => o.ownership_type === 'succursale'
                        ).length
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.round(
                        (organisations.filter(
                          o => o.ownership_type === 'succursale'
                        ).length /
                          organisations.length) *
                          100
                      )}
                      %
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Franchises</p>
                    <p className="text-2xl font-bold">
                      {
                        organisations.filter(
                          o => o.ownership_type === 'franchise'
                        ).length
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.round(
                        (organisations.filter(
                          o => o.ownership_type === 'franchise'
                        ).length /
                          organisations.length) *
                          100
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Carte */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Chargement...</span>
                </div>
              ) : organisations && organisations.length > 0 ? (
                <MapLibreMapView
                  organisations={organisations}
                  height={500}
                  onViewDetails={orgId => setMapDetailSheetOrgId(orgId)}
                />
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Aucune organisation à afficher
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Légende */}
            {organisations && organisations.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span>Propre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  <span>Franchise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#5DBEBB] text-white text-xs flex items-center justify-center font-semibold">
                    5+
                  </div>
                  <span>Cluster (cliquez pour zoomer)</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Grille de cartes */
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Chargement...</span>
              </div>
            ) : paginatedOrgs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm
                    ? 'Aucune organisation trouvée'
                    : 'Aucune organisation'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedOrgs.map(org => (
                  <div
                    key={org.id}
                    className={
                      highlightedOrgId === org.id
                        ? 'animate-pulse ring-4 ring-linkme-turquoise ring-opacity-50 rounded-xl'
                        : ''
                    }
                  >
                    <OrganisationCard
                      organisation={org}
                      stats={statsMap?.[org.id]}
                      onView={handleView}
                      onEdit={handleEdit}
                      onArchive={handleArchiveClick}
                      isLoading={isArchiving}
                      mode={
                        activeTab === 'incomplete' ? 'incomplete' : 'normal'
                      }
                      onEditShippingAddress={setShippingAddressModalOrg}
                      onEditOwnershipType={setOwnershipTypeModalOrg}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination - cachée en mode carte */}
        {totalPages > 1 && activeTab !== 'map' && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>

            <div className="flex items-center gap-1">
              {/* Première page */}
              {currentPage > 2 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="w-8 h-8 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    1
                  </button>
                  {currentPage > 3 && (
                    <span className="px-1 text-gray-400">...</span>
                  )}
                </>
              )}

              {/* Pages autour de la page courante */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  page =>
                    page >= currentPage - 1 &&
                    page <= currentPage + 1 &&
                    page >= 1 &&
                    page <= totalPages
                )
                .map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-linkme-turquoise text-white'
                        : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              {/* Dernière page */}
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && (
                    <span className="px-1 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="w-8 h-8 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sheet de détail (mode edit) - depuis la liste - gère l'édition inline */}
      <OrganisationDetailSheet
        organisationId={detailSheetOrgId}
        open={!!detailSheetOrgId}
        onOpenChange={open => !open && setDetailSheetOrgId(null)}
        mode="edit"
      />

      {/* Sheet de détail (mode view) - depuis la carte */}
      <OrganisationDetailSheet
        organisationId={mapDetailSheetOrgId}
        open={!!mapDetailSheetOrgId}
        onOpenChange={open => !open && setMapDetailSheetOrgId(null)}
        mode="view"
      />

      {/* Dialog de confirmation d'archivage */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archiver cette organisation ?"
        description={`${orgToArchive?.trade_name || orgToArchive?.legal_name || 'Cette organisation'} sera archivée. L'équipe Vérone sera notifiée.`}
        confirmText="Archiver"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleArchiveConfirm}
        loading={isArchiving}
      />

      {/* Quick Edit Modals */}
      <QuickEditShippingAddressModal
        organisationId={shippingAddressModalOrg?.id ?? ''}
        organisationName={
          shippingAddressModalOrg?.trade_name ||
          shippingAddressModalOrg?.legal_name ||
          ''
        }
        isOpen={!!shippingAddressModalOrg}
        onClose={() => setShippingAddressModalOrg(null)}
      />

      <QuickEditOwnershipTypeModal
        organisationId={ownershipTypeModalOrg?.id ?? ''}
        organisationName={
          ownershipTypeModalOrg?.trade_name ||
          ownershipTypeModalOrg?.legal_name ||
          ''
        }
        isOpen={!!ownershipTypeModalOrg}
        onClose={() => setOwnershipTypeModalOrg(null)}
      />
    </div>
  );
}

export default function OrganisationsPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-linkme-turquoise" />
        </div>
      }
    >
      <OrganisationsPageContent />
    </Suspense>
  );
}
