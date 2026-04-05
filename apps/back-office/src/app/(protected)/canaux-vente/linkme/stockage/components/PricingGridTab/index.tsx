'use client';

import { useState } from 'react';

import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import { Loader2, Plus, Euro, List, LayoutGrid } from 'lucide-react';

import {
  useStoragePricingTiers,
  useUpdatePricingTier,
  useCreatePricingTier,
  useDeletePricingTier,
  type StoragePricingTier,
} from '../../../hooks/use-linkme-storage';

import { PricingAddForm } from './PricingAddForm';
import { PricingGridView } from './PricingGridView';
import { PricingListView } from './PricingListView';

interface NewTierState {
  min: string;
  max: string;
  price: string;
  label: string;
}

export function PricingGridTab(): React.ReactElement {
  const { data: tiers, isLoading } = useStoragePricingTiers();
  const updateTier = useUpdatePricingTier();
  const createTier = useCreatePricingTier();
  const deleteTier = useDeletePricingTier();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTier, setNewTier] = useState<NewTierState>({
    min: '',
    max: '',
    price: '',
    label: '',
  });

  const getNextMinVolume = (): number => {
    if (!tiers || tiers.length === 0) return 0;
    const lastTier = tiers[tiers.length - 1];
    return lastTier.max_volume_m3 ?? lastTier.min_volume_m3;
  };

  const canAddTier =
    !tiers?.length || tiers[tiers.length - 1].max_volume_m3 !== null;

  const handleShowAddForm = (): void => {
    const nextMin = getNextMinVolume();
    setNewTier({ min: nextMin.toString(), max: '', price: '', label: '' });
    setShowAddForm(true);
  };

  const handleEditStart = (tier: StoragePricingTier): void => {
    setEditingId(tier.id);
    setEditPrice(tier.price_per_m3.toString());
  };

  const handleEditSave = (id: string): void => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) return;
    void updateTier
      .mutateAsync({ id, price_per_m3: price })
      .then(() => {
        setEditingId(null);
        setEditPrice('');
      })
      .catch(err => {
        console.error('[PricingGridTab] Edit save failed:', err);
      });
  };

  const handleEditCancel = (): void => {
    setEditingId(null);
    setEditPrice('');
  };

  const handleAddTier = (): void => {
    const min = parseFloat(newTier.min);
    const max = newTier.max ? parseFloat(newTier.max) : null;
    const price = parseFloat(newTier.price);
    if (isNaN(min) || isNaN(price)) return;
    void createTier
      .mutateAsync({
        min_volume_m3: min,
        max_volume_m3: max,
        price_per_m3: price,
        label: newTier.label ?? `${min} à ${max ?? '∞'} m³`,
      })
      .then(() => {
        setShowAddForm(false);
        setNewTier({ min: '', max: '', price: '', label: '' });
      })
      .catch(err => {
        console.error('[PricingGridTab] Add tier failed:', err);
      });
  };

  const handleDelete = (id: string): void => {
    if (!confirm('Supprimer cette tranche ?')) return;
    void deleteTier.mutateAsync(id).catch(err => {
      console.error('[PricingGridTab] Delete failed:', err);
    });
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

      {/* Add Form */}
      {showAddForm && (
        <PricingAddForm
          newTier={newTier}
          onNewTierChange={setNewTier}
          onSave={handleAddTier}
          onCancel={() => setShowAddForm(false)}
          isPending={createTier.isPending}
        />
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

      {/* Vue Liste */}
      {tiers && tiers.length > 0 && viewMode === 'list' && (
        <PricingListView
          tiers={tiers}
          editingId={editingId}
          editPrice={editPrice}
          isUpdatePending={updateTier.isPending}
          onEditStart={handleEditStart}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onEditPriceChange={setEditPrice}
          onDelete={handleDelete}
        />
      )}

      {/* Vue Grille */}
      {tiers && tiers.length > 0 && viewMode === 'grid' && (
        <PricingGridView
          tiers={tiers}
          editingId={editingId}
          editPrice={editPrice}
          isUpdatePending={updateTier.isPending}
          onEditStart={handleEditStart}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onEditPriceChange={setEditPrice}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
