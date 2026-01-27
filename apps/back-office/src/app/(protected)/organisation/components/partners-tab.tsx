'use client';

import { useState, useMemo, useEffect } from 'react';

import { OrganisationListView } from '@verone/customers';
import { OrganisationCard } from '@verone/organisations';
import { PartnerFormModal } from '@verone/organisations';
import { useOrganisations } from '@verone/organisations';
import { Input } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Search, Plus, Building2, LayoutGrid, List } from 'lucide-react';

export function PartnersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [archivedPartners, setArchivedPartners] = useState<any[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, _setSelectedPartner] = useState<any>(null);

  const filters = useMemo(
    () => ({
      type: 'partner' as const,
      is_active: true,
      search: searchQuery || undefined,
    }),
    [searchQuery]
  );

  const {
    organisations: partners,
    loading,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch,
  } = useOrganisations(filters);

  const loadArchivedPartnersData = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('type', 'partner')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedPartners((data || []) as any[]);
    } catch (err) {
      console.error('Erreur chargement partenaires archivés:', err);
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedPartnersData();
    }
  }, [activeTab]);

  const handleArchive = async (partner: any) => {
    if (!partner.archived_at) {
      const success = await archiveOrganisation(partner.id);
      if (success) {
        refetch();
        if (activeTab === 'archived') {
          await loadArchivedPartnersData();
        }
      }
    } else {
      const success = await unarchiveOrganisation(partner.id);
      if (success) {
        refetch();
        await loadArchivedPartnersData();
      }
    }
  };

  const handleDelete = async (partner: any) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${partner.name}" ?\n\nCette action est irréversible !`
    );

    if (confirmed) {
      const success = await hardDeleteOrganisation(partner.id);
      if (success) {
        await loadArchivedPartnersData();
      }
    }
  };

  const displayedPartners =
    activeTab === 'active' ? partners : archivedPartners;
  const isLoading = activeTab === 'active' ? loading : archivedLoading;

  return (
    <div className="space-y-4">
      {/* Actions Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
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
              <span className="ml-2 opacity-70">
                ({archivedPartners.length})
              </span>
            </button>
          </div>

          {/* Toggle Grid/List View */}
          <div
            className="flex items-center gap-1 border rounded-lg"
            style={{ borderColor: colors.border.DEFAULT }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
              aria-label="Vue grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
              aria-label="Vue liste"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ButtonV2
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
        >
          Nouveau Partenaire
        </ButtonV2>
      </div>

      {/* Search */}
      <Card>
        <CardContent style={{ padding: spacing[3] }}>
          <div className="relative">
            <Search
              className="absolute left-3 top-3 h-4 w-4"
              style={{ color: colors.text.muted }}
            />
            <Input
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                borderColor: colors.border.DEFAULT,
                color: colors.text.DEFAULT,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Partners View (Grid or List) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent style={{ padding: spacing[2] }}>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedPartners.length === 0 ? (
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
                onClick={() => setIsModalOpen(true)}
                icon={Plus}
              >
                Créer un partenaire
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {displayedPartners.map(partner => (
            <OrganisationCard
              key={partner.id}
              organisation={{
                ...partner,
                type: 'partner',
              }}
              activeTab={activeTab}
              onArchive={() => handleArchive(partner)}
              onDelete={() => handleDelete(partner)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent style={{ padding: spacing[3] }}>
            <OrganisationListView
              organisations={displayedPartners.map(p => ({
                ...p,
                type: 'partner' as const,
              }))}
              activeTab={activeTab}
              onArchive={id => {
                const partner = displayedPartners.find(p => p.id === id);
                if (partner) handleArchive(partner);
              }}
              onDelete={id => {
                const partner = displayedPartners.find(p => p.id === id);
                if (partner) handleDelete(partner);
              }}
            />
          </CardContent>
        </Card>
      )}

      <PartnerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partner={selectedPartner}
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
