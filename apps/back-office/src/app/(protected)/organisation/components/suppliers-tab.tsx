'use client';

import { useState, useMemo, useEffect } from 'react';

import { OrganisationListView } from '@verone/customers';
import { OrganisationCard } from '@verone/organisations';
import { SupplierFormModal } from '@verone/organisations';
import { useSuppliers, type Organisation } from '@verone/organisations';
import { Input } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Plus,
  Building2,
  LayoutGrid,
  List,
} from 'lucide-react';

export function SuppliersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [archivedSuppliers, setArchivedSuppliers] = useState<Organisation[]>(
    []
  );
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, _setSelectedSupplier] = useState<Organisation | null>(
    null
  );

  const filters = useMemo(
    () => ({
      is_active: true,
      search: searchQuery || undefined,
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

  const loadArchivedSuppliersData = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select(
          `
          *,
          products:products(count)
        `
        )
        .eq('type', 'supplier')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;

      const organisationsWithCounts = (data || []).map((org: any) => {
        const { products, ...rest } = org;
        return {
          ...rest,
          _count: {
            products: products?.[0]?.count || 0,
          },
        };
      });

      setArchivedSuppliers(organisationsWithCounts as Organisation[]);
    } catch (err) {
      console.error('Erreur chargement fournisseurs archivés:', err);
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedSuppliersData();
    }
  }, [activeTab]);

  const handleArchive = async (supplier: Organisation) => {
    if (!supplier.archived_at) {
      const success = await archiveOrganisation(supplier.id);
      if (success) {
        refetch();
        if (activeTab === 'archived') {
          await loadArchivedSuppliersData();
        }
      }
    } else {
      const success = await unarchiveOrganisation(supplier.id);
      if (success) {
        refetch();
        await loadArchivedSuppliersData();
      }
    }
  };

  const handleDelete = async (supplier: Organisation) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${supplier.trade_name || supplier.legal_name}" ?\n\nCette action est irréversible !`
    );

    if (confirmed) {
      const success = await hardDeleteOrganisation(supplier.id);
      if (success) {
        await loadArchivedSuppliersData();
      }
    }
  };

  const displayedSuppliers =
    activeTab === 'active' ? suppliers : archivedSuppliers;
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
              <span className="ml-2 opacity-70">
                ({archivedSuppliers.length})
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
          Nouveau Fournisseur
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

      {/* Suppliers View (Grid or List) */}
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
      ) : displayedSuppliers.length === 0 ? (
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
                onClick={() => setIsModalOpen(true)}
                icon={Plus}
              >
                Créer un fournisseur
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {displayedSuppliers.map(supplier => (
            <OrganisationCard
              key={supplier.id}
              organisation={
                {
                  ...supplier,
                  type: 'supplier',
                } as any
              }
              activeTab={activeTab}
              onArchive={() => handleArchive(supplier)}
              onDelete={() => handleDelete(supplier)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent style={{ padding: spacing[3] }}>
            <OrganisationListView
              organisations={
                displayedSuppliers.map(s => ({
                  ...s,
                  type: 'supplier' as const,
                })) as any
              }
              activeTab={activeTab}
              onArchive={id => {
                const supplier = displayedSuppliers.find(s => s.id === id);
                if (supplier) handleArchive(supplier);
              }}
              onDelete={id => {
                const supplier = displayedSuppliers.find(s => s.id === id);
                if (supplier) handleDelete(supplier);
              }}
            />
          </CardContent>
        </Card>
      )}

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={selectedSupplier as any}
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
