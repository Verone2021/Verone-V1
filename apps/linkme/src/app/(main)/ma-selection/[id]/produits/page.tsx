'use client';

/**
 * Page Gestion Produits d'une Sélection
 * Design moderne avec charte graphique LinkMe
 *
 * Fonctionnalités :
 * - Liste des produits avec recherche
 * - Drag & drop pour réorganiser
 * - Modification marge inline
 * - Suppression avec confirmation
 * - Lien vers catalogue pour ajouter
 *
 * @module SelectionProductsPage
 * @since 2026-01-09
 */

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

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
  Edit3,
  Trash2,
  GripVertical,
  X,
  LayoutGrid,
  ShoppingBag,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

import { EditMarginModal } from '../../../../../components/selection/EditMarginModal';
import { useAuth, type LinkMeRole } from '../../../../../contexts/AuthContext';
import {
  useUserAffiliate,
  useUserSelections,
  useSelectionItems,
  useRemoveFromSelection,
  useReorderProducts,
  type SelectionItem,
} from '../../../../../lib/hooks/use-user-selection';
import { formatCurrency } from '../../../../../types/analytics';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'org_independante'];

export default function SelectionProductsPage() {
  const params = useParams();
  const selectionId = params.id as string;

  const { user, linkMeRole, initializing: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();

  // Trouver la sélection par ID ou slug (URL propre)
  const selection = selections?.find(
    s => s.id === selectionId || s.slug === selectionId
  );

  // Fetcher les items avec l'ID réel (pas le slug)
  const { data: items, isLoading: itemsLoading } = useSelectionItems(
    selection?.id ?? null
  );

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

  // Handler drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(item => item.id === active.id);
      const newIndex = localItems.findIndex(item => item.id === over.id);

      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems);

      // Sauvegarder l'ordre en base (avec l'ID réel, pas le slug)
      reorderMutation.mutate(
        {
          selectionId: selection?.id ?? '',
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
        selectionId: selection?.id ?? '',
      });
      toast.success('Produit retiré de la sélection');
      setDeletingItemId(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression';
      toast.error(errorMessage);
      setDeletingItemId(null);
    }
  };

  // Chargement
  if (authLoading || affiliateLoading || selectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin" />
          </div>
          <p className="text-linkme-marine/60 text-sm font-medium">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // Vérification accès - afficher message si non autorisé
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-xl font-bold text-linkme-marine mb-2">
            Accès non autorisé
          </h1>
          <p className="text-linkme-marine/60 mb-6 text-sm">
            Vous n&apos;avez pas les permissions pour accéder à cette page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Sélection non trouvée
  if (!selection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-xl font-bold text-linkme-marine mb-2">
            Sélection introuvable
          </h1>
          <p className="text-linkme-marine/60 mb-6 text-sm">
            Cette sélection n&apos;existe pas ou a été supprimée.
          </p>
          <Link
            href="/ma-selection"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux sélections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/ma-selection/${selection?.slug ?? selectionId}`}
            className="flex items-center gap-2 text-linkme-marine/60 hover:text-linkme-marine transition-colors text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">{selection.name}</span>
          </Link>

          <Link
            href={`/catalogue?selection=${selection?.id ?? ''}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-linkme-turquoise text-white rounded-xl font-semibold hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter des produits
          </Link>
        </div>

        {/* Titre avec icône */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-7 w-7 text-linkme-turquoise" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-linkme-marine">
              Produits de la sélection
            </h1>
            <p className="text-linkme-marine/60 text-sm">
              {filteredItems.length} produit
              {filteredItems.length > 1 ? 's' : ''}
              {searchQuery && ` trouvé${filteredItems.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-linkme-marine/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-12 pr-12 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all duration-200 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-linkme-marine/40 hover:text-linkme-marine transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Liste des produits */}
        {itemsLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin mx-auto" />
            <p className="text-linkme-marine/60 text-sm mt-3">
              Chargement des produits...
            </p>
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredItems.map(item => (
                    <SortableProductItem
                      key={item.id}
                      item={item}
                      onEdit={() => setEditingItem(item)}
                      onRemove={() => {
                        void handleRemoveItem(item).catch(error => {
                          console.error('[ProductList] Remove failed:', error);
                        });
                      }}
                      isDeleting={deletingItemId === item.id}
                      disabled={!!searchQuery}
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-linkme-turquoise" />
            </div>
            <h3 className="text-lg font-semibold text-linkme-marine mb-2">
              {searchQuery
                ? 'Aucun produit trouvé'
                : 'Aucun produit dans cette sélection'}
            </h3>
            <p className="text-linkme-marine/60 mb-6 text-sm max-w-sm mx-auto">
              {searchQuery
                ? "Essayez avec d'autres termes de recherche."
                : 'Ajoutez des produits depuis le catalogue pour commencer à vendre.'}
            </p>
            {!searchQuery && (
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Parcourir le catalogue
              </Link>
            )}
          </div>
        )}

        {/* Légende */}
        {filteredItems.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-linkme-marine/40">
            <span className="flex items-center gap-1.5">
              <GripVertical className="h-3.5 w-3.5" />
              Glisser pour réorganiser
            </span>
            <span className="flex items-center gap-1.5">
              <Edit3 className="h-3.5 w-3.5" />
              Modifier la marge
            </span>
            <span className="flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Retirer
            </span>
          </div>
        )}
      </div>

      {/* Modal édition marge */}
      {editingItem && selection && (
        <EditMarginModal
          item={editingItem}
          selectionId={selection.id}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Composant Sortable Product Item avec style LinkMe
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
      className={`flex items-center gap-4 p-4 hover:bg-linkme-turquoise/5 transition-all duration-200 ${
        isDragging
          ? 'bg-linkme-turquoise/10 shadow-lg z-10 relative rounded-xl'
          : ''
      }`}
    >
      {/* Grip pour drag & drop */}
      <button
        {...attributes}
        {...listeners}
        className={`text-linkme-marine/30 hover:text-linkme-turquoise cursor-grab active:cursor-grabbing transition-colors ${
          disabled ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        disabled={disabled}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Image */}
      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
        {item.product_image_url ? (
          <img
            src={item.product_image_url}
            alt={item.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info produit */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-linkme-marine truncate">
          {item.product_name}
        </h3>
        <p className="text-xs text-linkme-marine/50 font-mono">
          {item.product_reference}
        </p>
      </div>

      {/* Prix et marge */}
      <div className="text-right">
        <p className="font-bold text-linkme-marine">
          {formatCurrency(item.selling_price_ht)}
        </p>
        <p className="text-xs text-linkme-turquoise font-medium">
          Marge: {item.margin_rate.toFixed(1)}%
        </p>
      </div>

      {/* Stock */}
      <div className="text-center px-3">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            item.product_stock_real > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {item.product_stock_real > 0
            ? `${item.product_stock_real} en stock`
            : 'Rupture'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded-lg transition-colors"
          title="Modifier la marge"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={onRemove}
          disabled={isDeleting}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Retirer de la sélection"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
