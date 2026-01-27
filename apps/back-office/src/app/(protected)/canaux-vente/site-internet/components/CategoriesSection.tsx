/**
 * Composant: CategoriesSection
 * Gestion catégories pour le canal site internet (arborescence + toggle visibilité menu)
 */

'use client';

import { useState, useMemo, useCallback, memo } from 'react';

import { useToast } from '@verone/common/hooks';
import { useDebounce } from '@verone/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { ErrorStateCard } from '@verone/ui';
import { Input } from '@verone/ui';
import { KPICardUnified } from '@verone/ui';
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
  FolderTree,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Loader2,
  Folder,
  FolderOpen,
} from 'lucide-react';

// Hooks
import {
  useSiteInternetCategories,
  useToggleCategoryVisibility,
  useSiteInternetCategoriesStats,
  buildCategoryTree,
} from '../hooks/use-site-internet-categories';

/**
 * Composant Ligne Catégorie (récursif pour enfants) - Memoized
 */
const CategoryRow = memo(function CategoryRow({
  category,
  level = 0,
  onToggleVisibility,
  isTogglingId,
}: {
  category: any;
  level?: number;
  onToggleVisibility: (categoryId: string, isVisible: boolean) => void;
  isTogglingId?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand 2 premiers niveaux

  const hasChildren = category.children && category.children.length > 0;

  return (
    <>
      <TableRow>
        {/* Nom avec indentation */}
        <TableCell>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-muted rounded p-1"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 text-blue-600" />
              )
            ) : (
              <div className="h-4 w-4 rounded border bg-muted" />
            )}

            <span className="font-medium">{category.name}</span>
          </div>
        </TableCell>

        {/* Slug */}
        <TableCell className="text-sm text-muted-foreground">
          {category.slug || '—'}
        </TableCell>

        {/* Level */}
        <TableCell>
          <Badge variant="outline">Niveau {category.level}</Badge>
        </TableCell>

        {/* Statut actif */}
        <TableCell>
          {category.is_active ? (
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
          {category.display_order}
        </TableCell>

        {/* Toggle Visible Menu */}
        <TableCell>
          <Switch
            checked={category.is_visible_menu}
            onCheckedChange={() =>
              onToggleVisibility(category.id, !category.is_visible_menu)
            }
            disabled={!category.is_active || isTogglingId === category.id}
          />
        </TableCell>
      </TableRow>

      {/* Enfants (récursif) */}
      {hasChildren &&
        isExpanded &&
        category.children.map((child: any) => (
          <CategoryRow
            key={child.id}
            category={child}
            level={level + 1}
            onToggleVisibility={onToggleVisibility}
            isTogglingId={isTogglingId}
          />
        ))}
    </>
  );
});

/**
 * Section Catégories Principale
 */
export function CategoriesSection() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [togglingId, setTogglingId] = useState<string | undefined>();

  // Hooks
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSiteInternetCategories();
  const { data: stats } = useSiteInternetCategoriesStats();
  const toggleVisibility = useToggleCategoryVisibility();

  // Filtrage catégories (memoized avec debounce)
  const filteredCategories = useMemo(
    () =>
      categories.filter(category =>
        category.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [categories, debouncedSearch]
  );

  // Construire arborescence (memoized avec debounce)
  const categoryTree = useMemo(
    () => buildCategoryTree(debouncedSearch ? filteredCategories : categories),
    [debouncedSearch, filteredCategories, categories]
  );

  // Handler toggle visibilité (memoized)
  const handleToggleVisibility = useCallback(
    async (categoryId: string, newVisibility: boolean) => {
      setTogglingId(categoryId);
      try {
        await toggleVisibility.mutateAsync({
          categoryId,
          isVisible: newVisibility,
        });
        toast({
          title: newVisibility
            ? 'Catégorie visible dans le menu'
            : 'Catégorie masquée du menu',
          description: `La catégorie a été ${newVisibility ? 'rendue visible' : 'masquée'} dans la navigation du site.`,
        });
      } catch (_error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier la visibilité de la catégorie.',
          variant: 'destructive',
        });
      } finally {
        setTogglingId(undefined);
      }
    },
    [toggleVisibility, toast, setTogglingId]
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
      <ErrorStateCard
        title="Erreur de chargement"
        message={
          error instanceof Error
            ? error.message
            : 'Impossible de charger les catégories. Veuillez réessayer.'
        }
        variant="destructive"
        onRetry={() => {
          void refetch().catch(error => {
            console.error('[CategoriesSection] Refetch failed:', error);
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICardUnified
          variant="elegant"
          title="Catégories Total"
          value={stats?.total || 0}
          icon={FolderTree}
        />

        <KPICardUnified
          variant="elegant"
          title="Actives"
          value={stats?.active || 0}
          icon={Eye}
        />

        <KPICardUnified
          variant="elegant"
          title="Visibles Menu"
          value={stats?.visibleMenu || 0}
          icon={Folder}
        />

        <KPICardUnified
          variant="elegant"
          title="Racines"
          value={stats?.rootCategories || 0}
          icon={FolderTree}
        />
      </div>

      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catégories Site Internet</CardTitle>
              <CardDescription>
                {filteredCategories.length} catégories (
                {stats?.visibleMenu || 0} visibles dans le menu)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une catégorie..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Catégories (Arborescence) */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Ordre</TableHead>
                <TableHead>Visible Menu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryTree.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FolderTree className="h-8 w-8 opacity-50" />
                      <p>Aucune catégorie trouvée</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categoryTree.map(category => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    level={0}
                    onToggleVisibility={(categoryId, newVisibility) => {
                      void handleToggleVisibility(
                        categoryId,
                        newVisibility
                      ).catch(error => {
                        console.error(
                          '[CategoriesSection] handleToggleVisibility failed:',
                          error
                        );
                      });
                    }}
                    isTogglingId={togglingId}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Helper */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FolderTree className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Navigation Arborescente
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Les catégories sont affichées en arborescence selon leur
                hiérarchie (parent → enfants). Une catégorie doit être{' '}
                <strong>active</strong> ET <strong>visible menu</strong> pour
                apparaître dans la navigation du site. Cliquez sur les flèches
                pour déplier/replier les sous-catégories.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
