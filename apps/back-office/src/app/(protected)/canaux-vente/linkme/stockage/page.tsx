'use client';

/**
 * Page Stockage / Volumetrie - Back-Office LinkMe
 *
 * Vue d'ensemble du stockage entrepot avec onglets:
 * - Vue clients (cartes)
 * - Grille tarifaire (configuration prix avec toggle liste/grille)
 *
 * @module StockagePage
 * @since 2025-12-22
 */

import { useMemo, useState, useEffect } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Package,
  Loader2,
  Box,
  Warehouse,
  Users,
  TrendingUp,
  Plus,
  Search,
  Building2,
  Briefcase,
  ChevronRight,
  Settings,
  Euro,
  Save,
  Trash2,
  LayoutGrid,
  List,
  Pencil,
  X,
} from 'lucide-react';

import {
  useStorageOverview,
  useStorageTotals,
  useStoragePricingTiers,
  useUpdatePricingTier,
  useCreatePricingTier,
  useDeletePricingTier,
  formatVolumeM3,
  formatPrice,
  type StorageOverviewItem,
  type StoragePricingTier,
} from '../hooks/use-linkme-storage';

export default function StockagePage(): React.ReactElement {
  const searchParams = useSearchParams();
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState('clients');

  // Handle tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'tarifs') {
      setActiveTab('tarifs');
    }
  }, [searchParams]);

  const { data: overview, isLoading } = useStorageOverview();
  const { data: totals } = useStorageTotals();

  // Filter overview by search
  const filteredOverview = useMemo(() => {
    if (!overview) return [];
    if (!searchFilter) return overview;
    const lower = searchFilter.toLowerCase();
    return overview.filter(item =>
      item.owner_name?.toLowerCase().includes(lower)
    );
  }, [overview, searchFilter]);

  return (
    <div className="p-4">
      {/* Header - Plus compact */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Stockage & Volumetrie
          </h1>
          <p className="text-sm text-gray-500">
            Gestion du stockage entrepot par client
          </p>
        </div>
        <Link href="/canaux-vente/linkme/stockage/nouvelle-allocation">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nouvelle allocation
          </Button>
        </Link>
      </div>

      {/* KPIs - Plus compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard
          icon={Box}
          label="Volume total"
          value={formatVolumeM3(totals?.total_volume_m3 ?? 0)}
          color="blue"
        />
        <KPICard
          icon={TrendingUp}
          label="Vol. facturable"
          value={formatVolumeM3(totals?.billable_volume_m3 ?? 0)}
          color="green"
        />
        <KPICard
          icon={Package}
          label="Unites"
          value={`${totals?.total_units ?? 0}`}
          color="purple"
        />
        <KPICard
          icon={Users}
          label="Clients"
          value={`${totals?.affiliates_count ?? 0}`}
          color="orange"
        />
      </div>

      {/* Tabs: Vue Clients / Grille Tarifaire */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="clients" className="gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="tarifs" className="gap-1.5 text-sm">
            <Settings className="h-3.5 w-3.5" />
            Grille Tarifaire
          </TabsTrigger>
        </TabsList>

        {/* TAB: Vue Clients */}
        <TabsContent value="clients">
          {/* Search Filter */}
          <div className="mb-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredOverview.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center border">
              <Warehouse className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                Aucun stockage
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                {searchFilter
                  ? 'Aucun client ne correspond'
                  : "Aucun client n'a de produits"}
              </p>
            </div>
          )}

          {/* Cards Grid - Plus compact */}
          {!isLoading && filteredOverview.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredOverview.map(item => (
                <StorageCard
                  key={`${item.owner_type}-${item.owner_id}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: Grille Tarifaire */}
        <TabsContent value="tarifs">
          <PricingGridTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==============================================================
// COMPOSANTS LOCAUX - Tailles reduites
// ==============================================================

function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}): React.ReactElement {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-md ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StorageCard({
  item,
}: {
  item: StorageOverviewItem;
}): React.ReactElement {
  const isEnseigne = item.owner_type === 'enseigne';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md ${
              isEnseigne ? 'bg-blue-50' : 'bg-purple-50'
            }`}
          >
            {isEnseigne ? (
              <Building2 className="h-4 w-4 text-blue-600" />
            ) : (
              <Briefcase className="h-4 w-4 text-purple-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">
              {item.owner_name}
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1 py-0',
                isEnseigne
                  ? 'border-blue-300 text-blue-700'
                  : 'border-purple-300 text-purple-700'
              )}
            >
              {isEnseigne ? 'Enseigne' : 'Organisation'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {item.total_units}
            </p>
            <p className="text-[10px] text-gray-500">unites</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">
              {formatVolumeM3(item.total_volume_m3)}
            </p>
            <p className="text-[10px] text-gray-500">volume</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {item.products_count}
            </p>
            <p className="text-[10px] text-gray-500">produits</p>
          </div>
        </div>
        {item.billable_volume_m3 > 0 && (
          <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
            <span className="text-gray-500">Facturable</span>
            <span className="font-semibold text-green-600">
              {formatVolumeM3(item.billable_volume_m3)}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Link
          href={`/canaux-vente/linkme/stockage/${item.owner_type}-${item.owner_id}`}
          className="w-full"
        >
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            Voir details
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// ==============================================================
// GRILLE TARIFAIRE avec toggle Liste/Grille
// ==============================================================

function PricingGridTab(): React.ReactElement {
  const { data: tiers, isLoading } = useStoragePricingTiers();
  const updateTier = useUpdatePricingTier();
  const createTier = useCreatePricingTier();
  const deleteTier = useDeletePricingTier();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTier, setNewTier] = useState({
    min: '',
    max: '',
    price: '',
    label: '',
  });

  // Calculer le min pour la prochaine tranche (= max de la dernière)
  const getNextMinVolume = (): number => {
    if (!tiers || tiers.length === 0) return 0;
    const lastTier = tiers[tiers.length - 1];
    // Si la dernière tranche est illimitée (max = null), retourner son min
    return lastTier.max_volume_m3 ?? lastTier.min_volume_m3;
  };

  // Vérifier si on peut ajouter une nouvelle tranche
  // (impossible si la dernière est illimitée)
  const canAddTier =
    !tiers?.length || tiers[tiers.length - 1].max_volume_m3 !== null;

  // Ouvrir le formulaire avec min pré-rempli
  const handleShowAddForm = (): void => {
    const nextMin = getNextMinVolume();
    setNewTier({
      min: nextMin.toString(),
      max: '',
      price: '',
      label: '',
    });
    setShowAddForm(true);
  };

  const handleEditStart = (tier: StoragePricingTier): void => {
    setEditingId(tier.id);
    setEditPrice(tier.price_per_m3.toString());
  };

  const handleEditSave = async (id: string): Promise<void> => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) return;

    await updateTier.mutateAsync({
      id,
      price_per_m3: price,
    });
    setEditingId(null);
    setEditPrice('');
  };

  const handleEditCancel = (): void => {
    setEditingId(null);
    setEditPrice('');
  };

  const handleAddTier = async (): Promise<void> => {
    const min = parseFloat(newTier.min);
    const max = newTier.max ? parseFloat(newTier.max) : null;
    const price = parseFloat(newTier.price);

    if (isNaN(min) || isNaN(price)) return;

    await createTier.mutateAsync({
      min_volume_m3: min,
      max_volume_m3: max,
      price_per_m3: price,
      label: newTier.label || `${min} à ${max ?? '∞'} m³`,
    });

    setShowAddForm(false);
    setNewTier({ min: '', max: '', price: '', label: '' });
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Supprimer cette tranche ?')) return;
    await deleteTier.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header avec toggle vue */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-1.5">
            <Euro className="h-4 w-4" />
            Grille tarifaire
          </h2>
          <p className="text-xs text-gray-500">
            Prix par m³ selon le volume total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Vue */}
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              title="Vue liste"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              title="Vue grille"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            size="sm"
            onClick={handleShowAddForm}
            disabled={showAddForm || !canAddTier}
            title={
              !canAddTier ? 'La derniere tranche est illimitee' : undefined
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Message si ajout impossible */}
      {!canAddTier && !showAddForm && (
        <p className="text-xs text-amber-600 mb-4">
          La derniere tranche est illimitee (max = ∞). Modifiez son max pour
          ajouter une nouvelle tranche.
        </p>
      )}

      {/* Add Form - Compact */}
      {showAddForm && (
        <Card className="mb-4 border-dashed border-blue-300 bg-blue-50/30">
          <CardContent className="p-3">
            <div className="flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-[80px]">
                <label className="text-xs text-gray-500 mb-1 block">
                  Min (m³)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTier.min}
                  disabled
                  className="h-8 text-sm bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="flex-1 min-w-[80px]">
                <label className="text-xs text-gray-500 mb-1 block">
                  Max (m³)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="∞"
                  value={newTier.max}
                  onChange={e =>
                    setNewTier(prev => ({ ...prev, max: e.target.value }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[80px]">
                <label className="text-xs text-gray-500 mb-1 block">
                  Prix/m³ (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={newTier.price}
                  onChange={e =>
                    setNewTier(prev => ({ ...prev, price: e.target.value }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs text-gray-500 mb-1 block">
                  Label
                </label>
                <Input
                  type="text"
                  placeholder="0 à 5 m³"
                  value={newTier.label}
                  onChange={e =>
                    setNewTier(prev => ({ ...prev, label: e.target.value }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => void handleAddTier()}
                  disabled={createTier.isPending}
                  className="h-8 px-2"
                >
                  {createTier.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="h-8 px-2"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!tiers || tiers.length === 0) && !showAddForm && (
        <div className="bg-white rounded-lg p-8 text-center border">
          <Euro className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Aucune tranche
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Configurez vos prix par volume
          </p>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Creer une tranche
          </Button>
        </div>
      )}

      {/* VUE LISTE */}
      {tiers && tiers.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">
                  Tranche
                </th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">
                  Volume
                </th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">
                  Prix/m³
                </th>
                <th className="text-right px-3 py-2 font-medium text-gray-600 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tiers.map((tier, index) => (
                <tr key={tier.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">
                    {tier.label ??
                      `${tier.min_volume_m3} - ${tier.max_volume_m3 ?? '∞'} m³`}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {tier.min_volume_m3} à {tier.max_volume_m3 ?? '∞'} m³
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editingId === tier.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="w-20 h-7 text-sm text-right"
                          autoFocus
                        />
                        <button
                          onClick={() => void handleEditSave(tier.id)}
                          disabled={updateTier.isPending}
                          className="p-1.5 rounded hover:bg-green-50 disabled:opacity-50"
                          title="Sauvegarder"
                        >
                          {updateTier.isPending ? (
                            <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="p-1.5 rounded hover:bg-red-50"
                          title="Annuler"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-green-600">
                        {formatPrice(tier.price_per_m3)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editingId !== tier.id && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditStart(tier)}
                          className="p-1.5 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </button>
                        {index === tiers.length - 1 && (
                          <button
                            onClick={() => void handleDelete(tier.id)}
                            className="p-1.5 rounded hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VUE GRILLE */}
      {tiers && tiers.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tiers.map((tier, index) => (
            <Card key={tier.id} className="relative group">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-gray-600 mb-1 truncate">
                  {tier.label ??
                    `${tier.min_volume_m3} - ${tier.max_volume_m3 ?? '∞'} m³`}
                </p>
                <p className="text-[10px] text-gray-400 mb-2">
                  {tier.min_volume_m3} à {tier.max_volume_m3 ?? '∞'} m³
                </p>
                {editingId === tier.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleEditSave(tier.id)}
                      disabled={updateTier.isPending}
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditCancel}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditStart(tier)}
                    className="text-xl font-bold text-green-600 hover:text-green-700"
                  >
                    {formatPrice(tier.price_per_m3)}
                  </button>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">par m³/mois</p>
              </CardContent>
              {/* Delete button - visible on hover, only for last tier */}
              {index === tiers.length - 1 && (
                <button
                  onClick={() => void handleDelete(tier.id)}
                  className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Supprimer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
