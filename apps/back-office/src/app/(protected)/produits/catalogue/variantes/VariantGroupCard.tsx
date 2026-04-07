'use client';

import type { VariantGroup, VariantProduct } from '@verone/types';

import { useRouter } from 'next/navigation';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Package,
  X,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import {
  formatVariantType,
  formatDate,
  getVariantTypeIcon,
} from './variantes.helpers';

interface VariantGroupCardProps {
  group: VariantGroup;
  isArchived: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (group: VariantGroup) => void;
  onDelete: (id: string) => Promise<void>;
  onArchive: (id: string, isArchived: boolean) => Promise<void>;
  onAddProducts: (group: VariantGroup) => void;
  onRemoveProduct: (productId: string, productName: string) => Promise<void>;
}

export function VariantGroupCard({
  group,
  isArchived,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onArchive,
  onAddProducts,
  onRemoveProduct,
}: VariantGroupCardProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full',
        isSelected && 'ring-2 ring-black'
      )}
    >
      {/* En-tête avec sélection */}
      <div className="p-3 border-b border-gray-200 flex-none">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(group.id)}
              className="mt-1 h-4 w-4 rounded border-gray-300 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getVariantTypeIcon(group.variant_type)}
                <h3 className="font-semibold text-gray-900 truncate text-sm">
                  {group.name}
                </h3>
              </div>
              {group.subcategory && (
                <p className="text-xs text-gray-500 truncate">
                  {group.subcategory.category?.name} → {group.subcategory.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
          >
            {formatVariantType(group.variant_type)}
          </Badge>
        </div>
      </div>

      {/* Aperçu des produits */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span className="font-medium">
            {group.product_count ?? 0} produit
            {(group.product_count ?? 0) !== 1 ? 's' : ''}
          </span>
          <span className="text-[10px] text-gray-400">
            Créé le {formatDate(group.created_at)}
          </span>
        </div>

        {/* Mini-galerie produits */}
        <div className="mb-2 h-14">
          {group.products && group.products.length > 0 ? (
            <div className="flex space-x-1.5 overflow-x-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {group.products.slice(0, 5).map((product: VariantProduct) => (
                <div
                  key={product.id}
                  className="relative flex-shrink-0 w-14 h-14 rounded bg-gray-100 overflow-hidden group/product"
                >
                  {product.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- Dynamic URL from Supabase Storage, next/image requires domain config */
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      void onRemoveProduct(product.id, product.name).catch(
                        error => {
                          console.error(
                            '[VariantGroupCard] Remove product failed:',
                            error
                          );
                        }
                      );
                    }}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/product:opacity-100 transition-opacity hover:bg-red-600"
                    title={`Retirer ${product.name}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {(group.product_count ?? 0) > 5 && (
                <div className="flex-shrink-0 w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                  +{(group.product_count ?? 0) - 5}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded">
              Aucun produit
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-2 pb-2 pt-1 border-t border-gray-100 flex-none">
        {!isArchived ? (
          <div className="grid grid-cols-4 gap-1">
            <ButtonV2
              size="sm"
              variant="outline"
              onClick={() => onAddProducts(group)}
              icon={Plus}
              className="w-full"
              title="Ajouter des produits"
            >
              Ajouter
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="outline"
              onClick={() =>
                router.push(`/produits/catalogue/variantes/${group.id}`)
              }
              icon={ExternalLink}
              className="w-full"
              title="Voir les détails"
            >
              Détails
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="ghost"
              onClick={() => onEdit(group)}
              icon={Edit3}
              className="w-full"
              title="Modifier le groupe"
            >
              Modifier
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="ghost"
              onClick={() => {
                void onArchive(group.id, false).catch(error => {
                  console.error('[VariantGroupCard] Archive failed:', error);
                });
              }}
              icon={Archive}
              className="w-full"
              title="Archiver le groupe"
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            <ButtonV2
              size="sm"
              variant="outline"
              onClick={() =>
                router.push(`/produits/catalogue/variantes/${group.id}`)
              }
              icon={ExternalLink}
              className="w-full"
              title="Voir les détails"
            >
              Détails
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="secondary"
              onClick={() => {
                void onArchive(group.id, true).catch(error => {
                  console.error('[VariantGroupCard] Restore failed:', error);
                });
              }}
              icon={ArchiveRestore}
              className="w-full"
              title="Restaurer le groupe"
            >
              Restaurer
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="destructive"
              onClick={() => {
                void onDelete(group.id).catch(error => {
                  console.error('[VariantGroupCard] Delete failed:', error);
                });
              }}
              icon={Trash2}
              className="w-full"
              title="Supprimer le groupe"
            />
          </div>
        )}
      </div>
    </div>
  );
}
