'use client';

import type { Collection } from '@verone/collections';

import { CollectionCard } from './CollectionCard';

interface CollectionsGridProps {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  isArchived: boolean;
  selectedCollections: string[];
  onSelect: (id: string) => void;
  onManageProducts: (collection: Collection) => void;
  onEdit: (collection: Collection) => void;
  onArchive: (collection: Collection) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNavigate: (id: string) => void;
}

export function CollectionsGrid({
  collections,
  isLoading,
  error,
  isArchived,
  selectedCollections,
  onSelect,
  onManageProducts,
  onEdit,
  onArchive,
  onDelete,
  onNavigate,
}: CollectionsGridProps) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 animate-pulse"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (error) {
    return (
      <div className="col-span-full p-8 text-center text-red-500 bg-white rounded-lg border border-red-200">
        Erreur lors du chargement des collections: {error}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
        {isArchived
          ? 'Aucune collection archivée'
          : 'Aucune collection trouvée pour les critères sélectionnés'}
      </div>
    );
  }

  return (
    <>
      {collections.map(collection => (
        <div key={collection.id}>
          <CollectionCard
            collection={collection}
            isArchived={isArchived}
            isSelected={selectedCollections.includes(collection.id)}
            onSelect={onSelect}
            onManageProducts={onManageProducts}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
            onNavigate={onNavigate}
          />
        </div>
      ))}
    </>
  );
}
