'use client';

/**
 * Page Organisations LinkMe
 *
 * @module OrganisationsPage
 * @since 2026-01-10
 * @updated 2026-04-14 - Refactoring: extraction OrganisationsPagination
 */

import { useEffect, useState, useMemo, Suspense } from 'react';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';

import { ConfirmDialog } from '@verone/ui';
import { Building2, Loader2, Search, Store, Users } from 'lucide-react';

import { CustomerOrganisationFormModal } from '@verone/organisations';

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
import { OrganisationsPagination } from './components/OrganisationsPagination';

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

const ITEMS_PER_PAGE = 18;
const ALLOWED_ROLES = [
  'enseigne_admin',
  'organisation_admin',
  'enseigne_collaborateur',
];

function OrganisationsPageContent(): JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, linkMeRole, initializing } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  const { data: organisations, isLoading: orgsLoading } =
    useEnseigneOrganisations(affiliate?.id ?? null);
  const enseigneId = affiliate?.enseigne_id ?? null;
  const { data: statsMap } = useOrganisationStats(enseigneId);
  const { mutate: archiveOrg, isPending: isArchiving } =
    useArchiveOrganisation();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<
    'all' | 'succursale' | 'franchise' | 'incomplete' | 'map'
  >('all');
  const [detailSheetOrgId, setDetailSheetOrgId] = useState<string | null>(null);
  const [detailSheetTab, setDetailSheetTab] = useState<
    'infos' | 'contacts' | 'activite'
  >('infos');
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [orgToArchive, setOrgToArchive] = useState<EnseigneOrganisation | null>(
    null
  );
  const [highlightedOrgId, setHighlightedOrgId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [mapDetailSheetOrgId, setMapDetailSheetOrgId] = useState<string | null>(
    null
  );
  const [shippingAddressModalOrg, setShippingAddressModalOrg] =
    useState<EnseigneOrganisation | null>(null);
  const [ownershipTypeModalOrg, setOwnershipTypeModalOrg] =
    useState<EnseigneOrganisation | null>(null);

  useEffect(() => {
    const highlightParam = searchParams?.get('highlight');
    if (highlightParam && organisations) {
      const orgExists = organisations.some(org => org.id === highlightParam);
      if (orgExists) {
        setDetailSheetOrgId(highlightParam);
        setHighlightedOrgId(highlightParam);
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
        setTimeout(() => setHighlightedOrgId(null), 3000);
      }
    }
  }, [searchParams, organisations, router]);

  useEffect(() => {
    if (!initializing && !user) router.push('/login');
  }, [user, initializing, router]);

  useEffect(() => {
    if (
      !initializing &&
      linkMeRole &&
      !ALLOWED_ROLES.includes(linkMeRole.role)
    ) {
      router.push('/dashboard');
    }
  }, [linkMeRole, initializing, router]);

  useEffect(() => setCurrentPage(1), [searchTerm, activeTab]);

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

  const filteredOrgs = useMemo(() => {
    if (!organisations) return [];
    let filtered = organisations;
    if (activeTab === 'succursale')
      filtered = organisations.filter(o => o.ownership_type === 'succursale');
    else if (activeTab === 'franchise')
      filtered = organisations.filter(o => o.ownership_type === 'franchise');
    else if (activeTab === 'incomplete')
      filtered = organisations.filter(o => !o.ownership_type);

    const searchLower = searchTerm.toLowerCase();
    return filtered.filter(
      org =>
        org.legal_name.toLowerCase().includes(searchLower) ||
        (org.trade_name?.toLowerCase().includes(searchLower) ?? false) ||
        (org.city?.toLowerCase().includes(searchLower) ?? false) ||
        (org.shipping_city?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [organisations, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
  const paginatedOrgs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrgs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrgs, currentPage]);

  const handleEdit = (org: EnseigneOrganisation) => {
    setDetailSheetTab('infos');
    setDetailSheetOrgId(org.id);
  };
  const handleAddContact = (org: EnseigneOrganisation) => {
    setDetailSheetTab('contacts');
    setDetailSheetOrgId(org.id);
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

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user || (linkMeRole && !ALLOWED_ROLES.includes(linkMeRole.role)))
    return null;

  const isLoading = affiliateLoading || orgsLoading;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            <OrganisationActionsBar
              onNewOrganisation={() => setCreateModalOpen(true)}
              disabled={isLoading}
            />
          </div>
        </div>

        <OrganisationFilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={tabStats}
        />

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

        {/* Contenu: Carte ou Grille */}
        {activeTab === 'map' ? (
          <>
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
                  </div>
                </div>
              </div>
            )}
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
                      onEdit={handleEdit}
                      onArchive={handleArchiveClick}
                      onAddContact={handleAddContact}
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

        {activeTab !== 'map' && (
          <OrganisationsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        )}
      </div>

      <OrganisationDetailSheet
        organisationId={detailSheetOrgId}
        open={!!detailSheetOrgId}
        onOpenChange={open => !open && setDetailSheetOrgId(null)}
        mode="edit"
        defaultTab={detailSheetTab}
      />
      <OrganisationDetailSheet
        organisationId={mapDetailSheetOrgId}
        open={!!mapDetailSheetOrgId}
        onOpenChange={open => !open && setMapDetailSheetOrgId(null)}
        mode="view"
      />

      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archiver cette organisation ?"
        description={`${orgToArchive?.trade_name ?? orgToArchive?.legal_name ?? 'Cette organisation'} sera archivée. L'équipe Vérone sera notifiée.`}
        confirmText="Archiver"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleArchiveConfirm}
        loading={isArchiving}
      />

      <QuickEditShippingAddressModal
        organisationId={shippingAddressModalOrg?.id ?? ''}
        organisationName={
          shippingAddressModalOrg?.trade_name ??
          shippingAddressModalOrg?.legal_name ??
          ''
        }
        isOpen={!!shippingAddressModalOrg}
        onClose={() => setShippingAddressModalOrg(null)}
      />

      <QuickEditOwnershipTypeModal
        organisationId={ownershipTypeModalOrg?.id ?? ''}
        organisationName={
          ownershipTypeModalOrg?.trade_name ??
          ownershipTypeModalOrg?.legal_name ??
          ''
        }
        isOpen={!!ownershipTypeModalOrg}
        onClose={() => setOwnershipTypeModalOrg(null)}
      />

      <CustomerOrganisationFormModal
        enseigneId={enseigneId}
        sourceType="linkme"
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
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
