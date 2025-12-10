'use client';

/**
 * Page Gestion Produits d'une Sélection
 * Liste complète avec réorganisation drag & drop, modification marge, suppression
 *
 * Fonctionnalités :
 * - Liste des produits avec recherche
 * - Drag & drop pour réorganiser
 * - Modification marge inline
 * - Suppression avec confirmation
 * - Lien vers catalogue pour ajouter
 *
 * @module SelectionProductsPage
 * @since 2025-12-10
 */

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  GripVertical,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { EditMarginModal } from '../../../../components/selection/EditMarginModal';
import { useAuth, type LinkMeRole } from '../../../../contexts/AuthContext';
import {
  useUserAffiliate,
  useUserSelections,
  useSelectionItems,
  useRemoveFromSelection,
  useReorderProducts,
  type SelectionItem,
} from '../../../../lib/hooks/use-user-selection';
import { formatCurrency } from '../../../../types/analytics';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'org_independante'];

export default function SelectionProductsPage() {
  const router = useRouter();
  const params = useParams();
  const selectionId = params.id as string;

  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();
  const { data: items, isLoading: itemsLoading } =
    useSelectionItems(selectionId);

  const removeItemMutation = useRemoveFromSelection();
  const reorderMutation = useReorderProducts();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<SelectionItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<SelectionItem[]>([]);

  // Sensors pour drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Trouver la sélection actuelle
  const selection = selections?.find(s => s.id === selectionId);

  // Synchroniser les items locaux avec les données serveur
  useEffect(() => {
    if (items) {
      setLocalItems(items);
    }
  }, [items]);

  // Filtrer les produits (seulement pour l'affichage)
  const filteredItems = localItems.filter(
    item =>
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product_reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Vérifier les droits d'accès
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (!linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, linkMeRole, authLoading, router]);

  // Handler drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(item => item.id === active.id);
      const newIndex = localItems.findIndex(item => item.id === over.id);

      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems);

      // Sauvegarder l'ordre en base
      reorderMutation.mutate(
        {
          selectionId,
          orderedItemIds: newItems.map(item => item.id),
        },
        {
          onSuccess: () => {
            toast.success('Ordre mis à jour');
          },
          onError: () => {
            // Restaurer l'ordre précédent en cas d'erreur
            setLocalItems(items || []);
            toast.error('Erreur lors de la réorganisation');
          },
        }
      );
    }
  };

  // Handler suppression
  const handleRemoveItem = async (item: SelectionItem) => {
    setDeletingItemId(item.id);

    try {
      await removeItemMutation.mutateAsync({
        itemId: item.id,
        selectionId: selectionId,
      });
      toast.success('Produit retiré de la sélection');
      setDeletingItemId(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
      setDeletingItemId(null);
    }
  };

  // Chargement
  if (authLoading || affiliateLoading || selectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérification accès
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return null;
  }

  // Sélection non trouvée
  if (!selection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Sélection introuvable
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            Cette sélection n'existe pas ou a été supprimée.
          </p>
          <Link
            href="/ma-selection"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux sélections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/ma-selection/${selectionId}`}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">{selection.name}</span>
          </Link>

          <Link
            href={`/catalogue?selection=${selectionId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter des produits
          </Link>
        </div>

        {/* Titre et compteur */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">
            Produits de la sélection
          </h1>
          <p className="text-gray-600 text-sm">
            {filteredItems.length} produit{filteredItems.length > 1 ? 's' : ''}
            {searchQuery && ` (filtré${filteredItems.length > 1 ? 's' : ''})`}
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Liste des produits */}
        {itemsLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
          </div>
        ) : filteredItems.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredItems.map(item => (
                    <SortableProductItem
                      key={item.id}
                      item={item}
                      onEdit={() => setEditingItem(item)}
                      onRemove={() => handleRemoveItem(item)}
                      isDeleting={deletingItemId === item.id}
                      disabled={!!searchQuery}
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery
                ? 'Aucun produit trouvé'
                : 'Aucun produit dans cette sélection'}
            </h3>
            <p className="text-gray-500 mb-4 text-sm">
              {searchQuery
                ? "Essayez avec d'autres termes de recherche."
                : 'Ajoutez des produits depuis le catalogue pour commencer.'}
            </p>
            {!searchQuery && (
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Parcourir le catalogue
              </Link>
            )}
          </div>
        )}

        {/* Légende */}
        {filteredItems.length > 0 && (
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              <GripVertical className="inline h-3 w-3 mr-0.5" /> Glisser pour
              réorganiser | <Edit2 className="inline h-3 w-3 mr-0.5" /> Modifier
              la marge | <Trash2 className="inline h-3 w-3 mr-0.5" /> Retirer
            </p>
          </div>
        )}
      </div>

      {/* Modal édition marge */}
      {editingItem && (
        <EditMarginModal
          item={editingItem}
          selectionId={selectionId}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Composant Sortable Product Item
// ============================================================================

interface SortableProductItemProps {
  item: SelectionItem;
  onEdit: () => void;
  onRemove: () => void;
  isDeleting: boolean;
  disabled: boolean;
}

function SortableProductItem({
  item,
  onEdit,
  onRemove,
  isDeleting,
  disabled,
}: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
        isDragging ? 'bg-blue-50 shadow-lg z-10 relative' : ''
      }`}
    >
      {/* Grip pour drag & drop */}
      <button
        {...attributes}
        {...listeners}
        className={`text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing ${
          disabled ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        disabled={disabled}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Image */}
      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {item.product_image_url ? (
          <img
            src={item.product_image_url}
            alt={item.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-4 w-4 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info produit */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate text-sm">
          {item.product_name}
        </h3>
        <p className="text-xs text-gray-500 font-mono">
          {item.product_reference}
        </p>
      </div>

      {/* Prix et marge */}
      <div className="text-right">
        <p className="font-bold text-gray-900 text-sm">
          {formatCurrency(item.selling_price_ht)} HT
        </p>
        <p className="text-xs text-gray-500">
          Marge: {item.margin_rate.toFixed(1)}%
        </p>
      </div>

      {/* Stock */}
      <div className="text-center px-2">
        <p
          className={`text-xs font-medium ${
            item.product_stock_real > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {item.product_stock_real > 0
            ? `${item.product_stock_real} stock`
            : 'Rupture'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onEdit}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Modifier la marge"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemove}
          disabled={isDeleting}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Retirer de la sélection"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
