// Types locaux pour la page collections

export interface LocalCollectionFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  visibility: 'all' | 'public' | 'private';
}

export interface CollectionProduct {
  id: string;
  name: string;
  image_url: string | null;
}
