/**
 * CategoryFilterCombobox - Filtre hiérarchique de catégories avec recherche
 *
 * Composant moderne pour filtrer par famille > catégorie > sous-catégorie
 * Utilise shadcn/ui Combobox pattern avec autocomplete
 *
 * Usage: Variantes, Collections, Produits
 */

'use client';

import * as React from 'react';

import { Button } from '@verone/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@verone/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// =====================================================================
// TYPES
// =====================================================================

export interface CategoryHierarchy {
  subcategoryId: string;
  familyName: string;
  categoryName: string;
  subcategoryName: string;
  /** Format: "Famille > Catégorie > Sous-catégorie" */
  fullPath: string;
}

export interface CategoryFilterComboboxProps {
  /** Valeur actuelle (subcategory_id) */
  value?: string;
  /** Callback changement valeur */
  onValueChange: (subcategoryId: string | undefined) => void;
  /** Placeholder */
  placeholder?: string;
  /** Type d'entités à filtrer (pour query DB) */
  entityType?: 'variant_groups' | 'collections' | 'products';
  /** Classe CSS personnalisée */
  className?: string;
}

// =====================================================================
// COMPOSANT
// =====================================================================

export function CategoryFilterCombobox({
  value,
  onValueChange,
  placeholder = 'Filtrer par catégorie...',
  entityType = 'variant_groups',
  className,
}: CategoryFilterComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<CategoryHierarchy[]>([]);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  // Fetch catégories avec hiérarchie (UNIQUEMENT celles avec entités)
  const fetchCategories = async () => {
    try {
      setLoading(true);

      // Query selon type d'entité
      let query;

      if (entityType === 'variant_groups') {
        query = supabase
          .from('variant_groups')
          .select(
            `
            subcategory:subcategories!subcategory_id(
              id,
              name,
              category:categories!inner(
                id,
                name,
                family:families!inner(
                  id,
                  name
                )
              )
            )
          `
          )
          .is('archived_at', null)
          .not('subcategory_id', 'is', null);
      } else if (entityType === 'collections') {
        query = supabase
          .from('collections')
          .select(
            `
            subcategory:subcategories!inner(
              id,
              name,
              category:categories!inner(
                id,
                name,
                family:families!inner(
                  id,
                  name
                )
              )
            )
          `
          )
          .is('archived_at', null);
      } else {
        // products
        query = supabase
          .from('products')
          .select(
            `
            subcategory:subcategories!inner(
              id,
              name,
              category:categories!inner(
                id,
                name,
                family:families!inner(
                  id,
                  name
                )
              )
            )
          `
          )
          .is('archived_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Construire hiérarchies uniques
      const hierarchiesMap = new Map<string, CategoryHierarchy>();

      if (data) {
        // collections ou products
        data.forEach((item: any) => {
          const subcategory = item.subcategory;
          if (subcategory) {
            const hierarchy: CategoryHierarchy = {
              subcategoryId: subcategory.id,
              familyName: subcategory.category?.family?.name || 'N/A',
              categoryName: subcategory.category?.name || 'N/A',
              subcategoryName: subcategory.name,
              fullPath: `${subcategory.category?.family?.name || 'N/A'} > ${subcategory.category?.name || 'N/A'} > ${subcategory.name}`,
            };
            hierarchiesMap.set(subcategory.id, hierarchy);
          }
        });
      }

      // Trier par fullPath
      const uniqueCategories = Array.from(hierarchiesMap.values()).sort(
        (a, b) => a.fullPath.localeCompare(b.fullPath, 'fr')
      );

      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Fetch categories error:', err);
      toast.error('Erreur chargement catégories');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, [entityType]);

  // Label affiché
  const selectedCategory = categories.find(c => c.subcategoryId === value);
  const displayLabel = selectedCategory?.fullPath || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une catégorie..." />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Chargement...' : 'Aucune catégorie trouvée'}
            </CommandEmpty>
            <CommandGroup>
              {/* Option "Toutes les catégories" */}
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onValueChange(undefined);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    !value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="font-medium">Toutes les catégories</span>
              </CommandItem>

              {/* Liste catégories */}
              {categories.map(category => (
                <CommandItem
                  key={category.subcategoryId}
                  value={category.fullPath}
                  onSelect={() => {
                    onValueChange(
                      category.subcategoryId === value
                        ? undefined
                        : category.subcategoryId
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === category.subcategoryId
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {category.fullPath}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
