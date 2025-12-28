'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Title, Text, Card } from '@tremor/react';
import { Building2, AlertCircle } from 'lucide-react';

import {
  NetworkCard,
  NetworkStatsGrid,
  FranceMap,
  SearchFilterBar,
  extractUniqueCities,
  filterOrganisations,
  type NetworkFilterType,
} from '@/components/network';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAffiliateNetwork,
  useNetworkStats,
  useArchiveOrganisation,
  useRestoreOrganisation,
} from '@/lib/hooks/use-affiliate-network';
import { useUserAffiliate } from '@/lib/hooks/use-user-selection';

export default function ReseauPage() {
  const router = useRouter();
  const { linkMeRole, loading: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  // Hooks réseau
  const { data: network, isLoading: networkLoading } = useAffiliateNetwork(
    affiliate?.id ?? null
  );
  const { stats, isLoading: statsLoading } = useNetworkStats(
    affiliate?.id ?? null
  );

  // Mutations
  const archiveMutation = useArchiveOrganisation();
  const restoreMutation = useRestoreOrganisation();

  // États filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NetworkFilterType>('all');
  const [selectedCity, setSelectedCity] = useState('all');

  // Vérifier si l'utilisateur est une enseigne
  const isEnseigne = linkMeRole?.role === 'enseigne_admin';

  // Extraire les villes uniques
  const cities = useMemo(() => {
    if (!network) return [];
    return extractUniqueCities(network);
  }, [network]);

  // Filtrer les organisations
  const filteredNetwork = useMemo(() => {
    if (!network) return [];
    return filterOrganisations(network, searchQuery, filterType, selectedCity);
  }, [network, searchQuery, filterType, selectedCity]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters =
    searchQuery !== '' || filterType !== 'all' || selectedCity !== 'all';

  // Reset des filtres
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSelectedCity('all');
  };

  // Handlers
  const handleArchive = (id: string) => {
    archiveMutation.mutate({ organisationId: id });
  };

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  // Loading state
  const isLoading = authLoading || affiliateLoading || networkLoading;

  // Redirection si pas enseigne (après chargement)
  if (!authLoading && !isEnseigne) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <Title>Accès réservé aux enseignes</Title>
            <Text className="mt-2 text-gray-600">
              Cette page est réservée aux comptes de type enseigne qui gèrent un
              réseau d&apos;établissements.
            </Text>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour au dashboard
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <Title>Mon Réseau</Title>
          </div>
          <Text className="text-gray-600">
            Gérez vos établissements propres et franchisés
          </Text>
        </div>

        {/* Stats Grid */}
        <div className="mb-6">
          <NetworkStatsGrid stats={stats} isLoading={statsLoading} />
        </div>

        {/* Recherche et filtres */}
        <div className="mb-6">
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            cities={cities}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Résultats */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredNetwork.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <Text className="text-gray-500">
              {hasActiveFilters
                ? 'Aucun établissement ne correspond à vos critères'
                : 'Aucun établissement dans votre réseau'}
            </Text>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-blue-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredNetwork.map(org => (
              <NetworkCard
                key={org.id}
                organisation={org}
                onArchive={handleArchive}
                onRestore={handleRestore}
                isLoading={
                  archiveMutation.isPending || restoreMutation.isPending
                }
              />
            ))}
          </div>
        )}

        {/* Carte de France */}
        {!isLoading && stats.byRegion.length > 0 && (
          <div className="mt-8">
            <FranceMap
              regionData={stats.byRegion}
              isLoading={statsLoading}
              height={450}
            />
          </div>
        )}
      </div>
    </div>
  );
}
