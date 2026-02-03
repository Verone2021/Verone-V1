'use client';

import { useState, useMemo, useEffect } from 'react';

import { CustomerFormModal } from '@verone/customers';
import { OrganisationListView } from '@verone/customers';
import { OrganisationCard } from '@verone/organisations';
import {
  useOrganisations,
  getOrganisationDisplayName,
  type Organisation,
} from '@verone/organisations';
import { Input } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Search, Plus, Building2, LayoutGrid, List } from 'lucide-react';

// ✅ FIX TypeScript: Utiliser type Organisation (pas de Customer local)
// IMPORTANT: Organisation utilise "legal_name" (pas "name")
// Interface Organisation définie dans use-organisations.ts

export function CustomersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [archivedCustomers, setArchivedCustomers] = useState<Organisation[]>(
    []
  );
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, _setSelectedCustomer] =
    useState<Organisation | null>(null);

  const filters = useMemo(
    () => ({
      is_active: true,
      search: searchQuery ?? undefined,
    }),
    [searchQuery]
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
    return customers.filter(customer => customer.type === 'customer');
  }, [customers]);

  const _stats = useMemo(() => {
    const total = filteredCustomers.length;
    const active = filteredCustomers.filter(c => c.is_active).length;
    const professional = filteredCustomers.filter(
      c => c.customer_type === 'professional'
    ).length;
    const individual = filteredCustomers.filter(
      c => c.customer_type === 'individual'
    ).length;

    return { total, active, professional, individual };
  }, [filteredCustomers]);

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

      // Ajouter le champ calculé 'name' pour chaque organisation
      const customersWithName = (data ?? []).map(org => ({
        ...org,
        name: org.trade_name || org.legal_name,
      })) as Organisation[];
      setArchivedCustomers(customersWithName);
    } catch (err) {
      console.error('Erreur chargement clients archivés:', err);
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedCustomersData().catch(error => {
        console.error('[CustomersTab] Load archived failed:', error);
      });
    }
  }, [activeTab]);

  const handleArchive = async (customer: Organisation) => {
    if (!customer.archived_at) {
      const success = await archiveOrganisation(customer.id);
      if (success) {
        await refetch();
        if (activeTab === 'archived') {
          await loadArchivedCustomersData();
        }
      }
    } else {
      const success = await unarchiveOrganisation(customer.id);
      if (success) {
        await refetch();
        await loadArchivedCustomersData();
      }
    }
  };

  const handleDelete = async (customer: Organisation) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${getOrganisationDisplayName(customer)}" ?\n\nCette action est irréversible !`
    );

    if (confirmed) {
      const success = await hardDeleteOrganisation(customer.id);
      if (success) {
        await loadArchivedCustomersData();
      }
    }
  };

  const displayedCustomers =
    activeTab === 'active' ? filteredCustomers : archivedCustomers;
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
              <span className="ml-2 opacity-70">
                ({filteredCustomers.length})
              </span>
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
                ({archivedCustomers.length})
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
          Nouveau Client
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

      {/* Customers View (Grid or List) */}
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
      ) : displayedCustomers.length === 0 ? (
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
                onClick={() => setIsModalOpen(true)}
                icon={Plus}
              >
                Créer un client
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {displayedCustomers.map(customer => (
            <OrganisationCard
              key={customer.id}
              organisation={
                {
                  ...customer,
                  type: 'customer' as const,
                } as unknown as Parameters<
                  typeof OrganisationCard
                >[0]['organisation']
              }
              activeTab={activeTab}
              onArchive={() => {
                void handleArchive(customer).catch(error => {
                  console.error('[CustomersTab] Archive failed:', error);
                });
              }}
              onDelete={() => {
                void handleDelete(customer).catch(error => {
                  console.error('[CustomersTab] Delete failed:', error);
                });
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent style={{ padding: spacing[3] }}>
            <OrganisationListView
              organisations={
                displayedCustomers.map(c => ({
                  ...c,
                  type: 'customer' as const,
                })) as unknown as Parameters<
                  typeof OrganisationListView
                >[0]['organisations']
              }
              activeTab={activeTab}
              onArchive={id => {
                const customer = displayedCustomers.find(c => c.id === id);
                if (customer) {
                  void handleArchive(customer).catch(error => {
                    console.error('[CustomersTab] Archive failed:', error);
                  });
                }
              }}
              onDelete={id => {
                const customer = displayedCustomers.find(c => c.id === id);
                if (customer) {
                  void handleDelete(customer).catch(error => {
                    console.error('[CustomersTab] Delete failed:', error);
                  });
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCustomerCreated={() => {
          void refetch().catch(error => {
            console.error('[CustomersTab] Refetch failed:', error);
          });
          setIsModalOpen(false);
        }}
        onCustomerUpdated={() => {
          void refetch().catch(error => {
            console.error('[CustomersTab] Refetch failed:', error);
          });
          setIsModalOpen(false);
        }}
        customer={selectedCustomer ?? undefined}
        mode={selectedCustomer ? 'edit' : 'create'}
      />
    </div>
  );
}
