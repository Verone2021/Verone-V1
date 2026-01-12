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

import { useEffect, useState, useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ConfirmDialog } from '@verone/ui';
import {
  Building2,
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import {
  OrganisationCard,
  OrganisationDetailSheet,
  EditOrganisationModal,
} from '../../../components/organisations';
import { useAuth } from '../../../contexts/AuthContext';
import { useArchiveOrganisation } from '../../../lib/hooks/use-archive-organisation';
import {
  useEnseigneOrganisations,
  type EnseigneOrganisation,
} from '../../../lib/hooks/use-enseigne-organisations';
import { useOrganisationStats } from '../../../lib/hooks/use-organisation-stats';
import { useUserAffiliate } from '../../../lib/hooks/use-user-selection';

// Configuration pagination
const ITEMS_PER_PAGE = 18; // 3 colonnes x 6 lignes

// Rôles autorisés à voir cette page
const ALLOWED_ROLES = ['enseigne_admin', 'organisation_admin'];

export default function OrganisationsPage(): JSX.Element | null {
  const router = useRouter();
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
    'all' | 'succursale' | 'franchise' | 'incomplete'
  >('all');
  const [selectedOrg, setSelectedOrg] = useState<EnseigneOrganisation | null>(
    null
  );
  const [detailSheetOrgId, setDetailSheetOrgId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [orgToArchive, setOrgToArchive] = useState<EnseigneOrganisation | null>(
    null
  );

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
  const handleView = (org: EnseigneOrganisation) => {
    setSelectedOrg(org);
    setDetailSheetOrgId(org.id);
  };

  const handleEdit = (org: EnseigneOrganisation) => {
    setSelectedOrg(org);
    setEditModalOpen(true);
  };

  const handleArchiveClick = (org: EnseigneOrganisation) => {
    setOrgToArchive(org);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (orgToArchive) {
      archiveOrg(orgToArchive.id);
      setArchiveDialogOpen(false);
      setOrgToArchive(null);
    }
  };

  const goToPage = (page: number) => {
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

          <div className="flex items-center justify-between">
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

            <button
              onClick={() => {
                // TODO: Modal d'ajout
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-linkme-turquoise text-white rounded-lg hover:bg-linkme-turquoise/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
        </div>

        {/* Onglets de filtrage par type */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-linkme-turquoise text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Tous
            <span className="ml-1.5 opacity-70">({tabStats.all})</span>
          </button>
          <button
            onClick={() => setActiveTab('succursale')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'succursale'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Propres
            <span className="ml-1.5 opacity-70">({tabStats.succursale})</span>
          </button>
          <button
            onClick={() => setActiveTab('franchise')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'franchise'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Franchises
            <span className="ml-1.5 opacity-70">({tabStats.franchise})</span>
          </button>
          {tabStats.incomplete > 0 && (
            <button
              onClick={() => setActiveTab('incomplete')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'incomplete'
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              À compléter
              <span className="ml-1.5 opacity-70">({tabStats.incomplete})</span>
            </button>
          )}
        </div>

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

        {/* Grille de cartes */}
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
              <OrganisationCard
                key={org.id}
                organisation={org}
                stats={statsMap?.[org.id]}
                onView={handleView}
                onEdit={handleEdit}
                onArchive={handleArchiveClick}
                isLoading={isArchiving}
                mode={activeTab === 'incomplete' ? 'incomplete' : 'normal'}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
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

      {/* Sheet de détail (mode edit) */}
      <OrganisationDetailSheet
        organisationId={detailSheetOrgId}
        open={!!detailSheetOrgId}
        onOpenChange={open => !open && setDetailSheetOrgId(null)}
        mode="edit"
        onEdit={() => {
          // Ouvrir le modal d'édition et fermer le sheet
          if (selectedOrg) {
            setEditModalOpen(true);
            setDetailSheetOrgId(null);
          }
        }}
      />

      {/* Modal d'édition */}
      <EditOrganisationModal
        organisation={selectedOrg}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
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
    </div>
  );
}
