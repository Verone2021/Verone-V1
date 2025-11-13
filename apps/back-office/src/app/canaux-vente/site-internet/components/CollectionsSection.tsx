/**
 * Composant: CollectionsSection
 * Gestion visibilité collections pour le canal site internet
 */

'use client';

import { useState, useEffect } from 'react';

import { useToast } from '@verone/common/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Switch } from '@verone/ui';
import {
  Search,
  Palette,
  Eye,
  EyeOff,
  Star,
  Loader2,
  Image as ImageIcon,
  Package,
} from 'lucide-react';

// Hooks
import {
  useSiteInternetCollections,
  useToggleCollectionVisibility,
  isCollectionVisibleOnChannel,
  useSiteInternetCollectionsStats,
} from '../hooks/use-site-internet-collections';
import { useSiteInternetConfig } from '../hooks/use-site-internet-config';

/**
 * Section Collections Principale
 */
export function CollectionsSection() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks
  const { data: collections = [], isLoading } = useSiteInternetCollections();
  const { data: config } = useSiteInternetConfig();
  const { data: stats } = useSiteInternetCollectionsStats();
  const toggleVisibility = useToggleCollectionVisibility();

  // Filtrage collections
  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler toggle visibilité
  const handleToggleVisibility = async (
    collectionId: string,
    currentlyVisible: boolean
  ) => {
    try {
      await toggleVisibility.mutateAsync({
        collectionId,
        isVisible: !currentlyVisible,
      });
      toast({
        title: currentlyVisible ? 'Collection masquée' : 'Collection visible',
        description: `La collection a été ${currentlyVisible ? 'masquée du' : 'rendue visible sur le'} site internet.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la visibilité de la collection.',
        variant: 'destructive',
      });
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Collections Total
                </p>
                <p className="text-2xl font-bold mt-1">{stats?.total || 0}</p>
              </div>
              <Palette className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold mt-1">{stats?.active || 0}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Visibles Site Internet
                </p>
                <p className="text-2xl font-bold mt-1">{stats?.visible || 0}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À la Une</p>
                <p className="text-2xl font-bold mt-1">
                  {stats?.featured || 0}
                </p>
              </div>
              <Star className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Collections Site Internet</CardTitle>
              <CardDescription>
                {filteredCollections.length} collections ({stats?.visible || 0}{' '}
                visibles sur le site)
              </CardDescription>
            </div>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Palette className="h-8 w-8 opacity-50" />
                      <p>Aucune collection trouvée</p>
                    </div>
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
                            <img
                              src={collection.image_url}
                              alt={collection.name}
                              className="h-full w-full object-cover"
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
                        {collection.name.toLowerCase().replace(/\s+/g, '-') ||
                          '—'}
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
                          onCheckedChange={() =>
                            handleToggleVisibility(collection.id, isVisible)
                          }
                          disabled={
                            !collection.is_active || toggleVisibility.isPending
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Helper */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Visibilité Collections
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Une collection doit être <strong>active</strong> ET{' '}
                <strong>visible sur le site internet</strong> pour apparaître
                sur le site public. Les collections inactives ne peuvent pas
                être rendues visibles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
