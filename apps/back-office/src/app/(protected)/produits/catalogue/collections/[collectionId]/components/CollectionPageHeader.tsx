'use client';

import { useRouter } from 'next/navigation';

import { COLLECTION_STYLE_OPTIONS } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { ChevronLeft } from 'lucide-react';

import type { CollectionData } from './types';

interface CollectionPageHeaderProps {
  collection: CollectionData;
}

export function CollectionPageHeader({
  collection,
}: CollectionPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <ButtonV2
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </ButtonV2>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {collection.name}
          </h1>
          <p className="text-gray-600 text-sm">
            {collection.description ?? 'Aucune description'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={collection.is_active ? 'secondary' : 'secondary'}>
          {collection.is_active ? 'Active' : 'Inactive'}
        </Badge>
        <Badge
          variant={collection.visibility === 'public' ? 'secondary' : 'outline'}
        >
          {collection.visibility === 'public' ? 'Publique' : 'Privée'}
        </Badge>
        {collection.style && (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-800 border-purple-200"
          >
            {
              COLLECTION_STYLE_OPTIONS.find(s => s.value === collection.style)
                ?.label
            }
          </Badge>
        )}
      </div>
    </div>
  );
}
