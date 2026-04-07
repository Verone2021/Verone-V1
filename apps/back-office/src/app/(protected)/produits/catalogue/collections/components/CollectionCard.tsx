'use client';

import Image from 'next/image';

import { getRoomLabel, type RoomType } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Edit3,
  Trash2,
  ExternalLink,
  Package,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import type { Collection } from '@verone/collections';

import { formatCollectionStyle, formatDate } from '../helpers';
import type { CollectionProduct } from '../types';

interface CollectionCardProps {
  collection: Collection;
  isArchived: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onManageProducts: (collection: Collection) => void;
  onEdit: (collection: Collection) => void;
  onArchive: (collection: Collection) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNavigate: (id: string) => void;
}

export function CollectionCard({
  collection,
  isArchived,
  isSelected,
  onSelect,
  onManageProducts,
  onEdit,
  onArchive,
  onDelete,
  onNavigate,
}: CollectionCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full',
        isSelected && 'ring-2 ring-black'
      )}
    >
      {/* En-tête avec sélection */}
      <div className="p-4 border-b border-gray-200 flex-none">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(collection.id)}
              className="mt-1 h-4 w-4 rounded border-gray-300 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-base">
                {collection.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Badges compacts sur deux lignes */}
        <div className="space-y-1.5">
          {/* Ligne 1: Status, Visibilité, Style */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 flex-shrink-0"
            >
              {collection.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            <Badge
              variant={
                collection.visibility === 'public' ? 'outline' : 'secondary'
              }
              className="text-[10px] px-1.5 py-0.5 flex-shrink-0"
            >
              {collection.visibility === 'public' ? 'Public' : 'Privé'}
            </Badge>
            {collection.style && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
              >
                {formatCollectionStyle(collection.style)}
              </Badge>
            )}
          </div>

          {/* Ligne 2: Suitable Rooms + Theme Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {collection.suitable_rooms &&
              collection.suitable_rooms.length > 0 &&
              collection.suitable_rooms.slice(0, 3).map(room => (
                <Badge
                  key={room}
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
                >
                  {getRoomLabel(room as RoomType)}
                </Badge>
              ))}
            {collection.suitable_rooms &&
              collection.suitable_rooms.length > 3 && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
                >
                  +{collection.suitable_rooms.length - 3}
                </Badge>
              )}

            {collection.theme_tags &&
              collection.theme_tags.length > 0 &&
              collection.theme_tags.slice(0, 2).map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
                >
                  🏷️ {tag}
                </Badge>
              ))}
            {collection.theme_tags && collection.theme_tags.length > 2 && (
              <Badge
                variant="outline"
                className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
              >
                +{collection.theme_tags.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Aperçu des produits */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span className="font-medium">
            {collection.product_count} produit
            {collection.product_count !== 1 ? 's' : ''}
          </span>
          <span className="text-[10px] text-gray-400">
            Créé le {formatDate(collection.created_at)}
          </span>
        </div>

        {/* Mini-galerie produits */}
        <div className="mb-2 h-14">
          {collection.products && collection.products.length > 0 ? (
            <div className="flex space-x-1.5 overflow-x-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {(collection.products as CollectionProduct[])
                .slice(0, 5)
                .map(product => (
                  <div
                    key={product.id}
                    className="relative flex-shrink-0 w-14 h-14 rounded bg-gray-100 overflow-hidden"
                  >
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              {collection.product_count > 5 && (
                <div className="flex-shrink-0 w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                  +{collection.product_count - 5}
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

      {/* Footer avec actions */}
      <div className="px-3 pb-2 pt-1.5 border-t border-gray-100 flex-none">
        {!isArchived ? (
          <div className="grid grid-cols-4 gap-1">
            <ButtonV2
              size="sm"
              variant="outline"
              onClick={() => onManageProducts(collection)}
              icon={Package}
              className="w-full"
              title="Gérer produits"
            >
              Produits
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="outline"
              onClick={() => onNavigate(collection.id)}
              icon={ExternalLink}
              className="w-full"
              title="Voir les détails"
            >
              Détails
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="ghost"
              onClick={() => onEdit(collection)}
              icon={Edit3}
              className="w-full"
              title="Modifier la collection"
            >
              Modifier
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="ghost"
              onClick={() => {
                void onArchive(collection);
              }}
              icon={Archive}
              className="w-full"
              title="Archiver"
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            <ButtonV2
              size="sm"
              variant="outline"
              onClick={() => onNavigate(collection.id)}
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
                void onArchive(collection);
              }}
              icon={ArchiveRestore}
              className="w-full"
              title="Restaurer"
            >
              Restaurer
            </ButtonV2>
            <ButtonV2
              size="sm"
              variant="destructive"
              onClick={() => {
                void onDelete(collection.id);
              }}
              icon={Trash2}
              className="w-full"
              title="Supprimer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
