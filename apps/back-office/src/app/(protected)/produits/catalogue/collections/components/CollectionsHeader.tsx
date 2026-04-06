'use client';

import { Plus } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';

interface CollectionsHeaderProps {
  onCreateCollection: () => void;
}

export function CollectionsHeader({
  onCreateCollection,
}: CollectionsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-light text-black">Collections</h1>
        <p className="text-gray-600 mt-1">
          Créez et partagez des sélections thématiques de produits
        </p>
      </div>
      <div>
        <ButtonV2
          onClick={onCreateCollection}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle collection
        </ButtonV2>
      </div>
    </div>
  );
}
