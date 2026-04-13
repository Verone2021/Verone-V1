'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';

import { useDebounce } from '@verone/hooks';
import { CollectionFormModal } from '@verone/common/components/collections';
import type {
  Collection as CollectionType,
  CreateCollectionData,
} from '@verone/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  ButtonV2,
  Input,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  Search,
  Eye,
  EyeOff,
  Star,
  Loader2,
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

// Hooks
import {
  useSiteInternetCollections,
  useToggleCollectionVisibility,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  isCollectionVisibleOnChannel,
  useSiteInternetCollectionsStats,
} from '../hooks/use-site-internet-collections';
import { useSiteInternetConfig } from '../hooks/use-site-internet-config';

export function CollectionsSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCollection, setEditingCollection] = useState<
    CollectionType | undefined
  >();

  // Hooks
  const {
    data: collections = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSiteInternetCollections();
  const { data: config } = useSiteInternetConfig();
  const { data: stats } = useSiteInternetCollectionsStats();
  const toggleVisibility = useToggleCollectionVisibility();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const openCreate = useCallback(() => {
    setEditingCollection(undefined);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((collection: CollectionType) => {
    setEditingCollection(collection);
    setModalMode('edit');
    setModalOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (rawData: Omit<CreateCollectionData, 'created_by'>) => {
      const data = {
        name: rawData.name ?? '',
        description: rawData.description ?? undefined,
        style: (rawData.style as string) ?? undefined,
        suitable_rooms: rawData.suitable_rooms ?? undefined,
        theme_tags: rawData.theme_tags ?? undefined,
        visibility: (rawData.visibility as string) ?? undefined,
        is_active: rawData.is_active ?? true,
      };
      if (modalMode === 'create') {
        await createCollection.mutateAsync(data);
        toast.success('Collection creee');
      } else if (editingCollection) {
        await updateCollection.mutateAsync({
          collectionId: editingCollection.id,
          data,
        });
        toast.success('Collection mise a jour');
      }
      setModalOpen(false);
    },
    [modalMode, editingCollection, createCollection, updateCollection]
  );

  const handleDelete = useCallback(
    async (collectionId: string) => {
      await deleteCollection.mutateAsync(collectionId);
      toast.success('Collection supprimee');
    },
    [deleteCollection]
  );

  // Filtrage collections (memoized avec debounce)
  const filteredCollections = useMemo(
    () =>
      collections.filter(collection =>
        collection.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [collections, debouncedSearch]
  );

  // Handler toggle visibilité (memoized)
  const handleToggleVisibility = useCallback(
    async (collectionId: string, currentlyVisible: boolean) => {
      try {
        await toggleVisibility.mutateAsync({
          collectionId,
          isVisible: !currentlyVisible,
        });
        toast.success(
          currentlyVisible
            ? 'Collection masquee du site'
            : 'Collection visible sur le site'
        );
      } catch (_error) {
        toast.error('Impossible de modifier la visibilite');
      }
    },
    [toggleVisibility]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-600">
          Erreur :{' '}
          {error instanceof Error ? error.message : 'Chargement impossible'}
          <ButtonV2
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={() => {
              void refetch();
            }}
          >
            Reessayer
          </ButtonV2>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Collections Site Internet</CardTitle>
              <CardDescription>
                {filteredCollections.length} collections ({stats?.visible ?? 0}{' '}
                visibles sur le site)
              </CardDescription>
            </div>
            <ButtonV2 size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle collection
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une collection..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Collections */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Visibilité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Ordre</TableHead>
                <TableHead>Visible Site</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Aucune collection trouvee
                  </TableCell>
                </TableRow>
              ) : (
                filteredCollections.map(collection => {
                  const isVisible = config
                    ? isCollectionVisibleOnChannel(collection, config.id)
                    : false;

                  return (
                    <TableRow key={collection.id}>
                      {/* Image */}
                      <TableCell>
                        {collection.image_url ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
                            <Image
                              src={collection.image_url}
                              alt={collection.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>

                      {/* Nom */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{collection.name}</span>
                          {collection.is_featured && (
                            <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                          )}
                        </div>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {collection.description}
                          </p>
                        )}
                      </TableCell>

                      {/* Slug */}
                      <TableCell className="text-sm text-muted-foreground">
                        {collection.slug ?? '—'}
                      </TableCell>

                      {/* Produits */}
                      <TableCell>
                        <Badge variant="outline">
                          {collection.product_count} produits
                        </Badge>
                      </TableCell>

                      {/* Visibilité globale */}
                      <TableCell>
                        <Badge
                          variant={
                            collection.visibility === 'public'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {collection.visibility}
                        </Badge>
                      </TableCell>

                      {/* Statut actif */}
                      <TableCell>
                        {collection.is_active ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <EyeOff className="h-4 w-4" />
                            <span className="text-sm">Inactive</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Ordre */}
                      <TableCell className="text-sm text-muted-foreground">
                        {collection.display_order}
                      </TableCell>

                      {/* Toggle Visible Site */}
                      <TableCell>
                        <Switch
                          checked={isVisible}
                          onCheckedChange={() => {
                            void handleToggleVisibility(
                              collection.id,
                              isVisible
                            ).catch(err => {
                              console.error('[CollectionsSection]', err);
                            });
                          }}
                          disabled={
                            !collection.is_active || toggleVisibility.isPending
                          }
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(collection)}
                          >
                            <Pencil className="h-4 w-4" />
                          </ButtonV2>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <ButtonV2 variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </ButtonV2>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Supprimer &quot;{collection.name}&quot; ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action supprimera la collection et
                                  dissociera tous ses produits. Les produits
                                  eux-memes ne seront pas supprimes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    void handleDelete(collection.id).catch(
                                      () => undefined
                                    );
                                  }}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Collection Form Modal (create/edit) */}
      <CollectionFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
        collection={editingCollection}
        mode={modalMode}
      />
    </div>
  );
}
