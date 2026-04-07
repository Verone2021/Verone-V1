import type { useRouter } from 'next/navigation';

import type { Collection, useCollections } from '@verone/collections';
import type { useToast } from '@verone/common';

// Type simplifié pour produit de collection (sous-ensemble de Product)
export type CollectionProduct = {
  id: string;
  name: string;
  sku?: string;
  image_url?: string;
  cost_price?: number;
  position?: number;
};

export interface CollectionProductCardProps {
  product: CollectionProduct;
  position?: number;
  onRemove: (id: string, name: string) => void;
  router: ReturnType<typeof useRouter>;
}

// Type collection provenant du hook useCollection
export type CollectionData = Collection;

export interface CollectionFieldProps {
  collection: CollectionData;
  collectionId: string;
  updateCollection: ReturnType<typeof useCollections>['updateCollection'];
  refetch: () => Promise<unknown>;
  toast: ReturnType<typeof useToast>['toast'];
}
