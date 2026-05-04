'use client';

import { useState, useRef, useEffect } from 'react';

import Link from 'next/link';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { createUntypedClient } from '@/lib/supabase/untyped-client';

interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface CategoryWithSubs {
  id: string;
  name: string;
  slug: string;
  subcategories: SubcategoryItem[];
}

function useCategoriesWithSubs() {
  const supabase = createUntypedClient();

  return useQuery({
    queryKey: ['categories-with-subcategories'],
    queryFn: async (): Promise<CategoryWithSubs[]> => {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (catError) throw catError;

      const { data: subcategories, error: subError } = await supabase
        .from('subcategories')
        .select('id, name, slug, category_id')
        .order('name');

      if (subError) throw subError;

      const subsByCategory = new Map<string, SubcategoryItem[]>();
      for (const sub of subcategories ?? []) {
        const catId = (sub as Record<string, unknown>).category_id as string;
        const existing = subsByCategory.get(catId) ?? [];
        existing.push({
          id: sub.id as string,
          name: sub.name as string,
          slug: sub.slug as string,
        });
        subsByCategory.set(catId, existing);
      }

      return (categories ?? []).map(cat => ({
        id: cat.id as string,
        name: cat.name as string,
        slug: cat.slug as string,
        subcategories: subsByCategory.get(cat.id as string) ?? [],
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: categories = [] } = useCategoriesWithSubs();

  // Familles à afficher : seulement celles qui ont des sous-catégories
  const relevantCategories = categories.filter(c => c.subcategories.length > 0);

  // Catégorie active (par défaut : la première)
  const activeCategory =
    relevantCategories.find(c => c.id === activeCategoryId) ??
    relevantCategories[0] ??
    null;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategoryId(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <Link
        href="/catalogue"
        className="flex items-center gap-1 text-sm font-medium text-verone-gray-600 hover:text-verone-black uppercase tracking-wide transition-colors duration-300"
      >
        Catalogue
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </Link>

      {/* Two-pane mega menu : familles à gauche, sous-catégories à droite.
          Pleine largeur viewport, fixed pour échapper au header sticky. */}
      {isOpen && relevantCategories.length > 0 && activeCategory && (
        <div
          className="fixed left-0 right-0 mt-4 bg-white border-y border-verone-gray-200 shadow-luxury-xl z-50"
          style={{ top: 'var(--header-height, 80px)' }}
        >
          <div className="max-w-7xl mx-auto flex max-h-[70vh]">
            {/* Pane gauche : liste verticale des familles */}
            <nav
              className="w-64 shrink-0 border-r border-verone-gray-100 py-6 overflow-y-auto"
              aria-label="Familles de produits"
            >
              <ul className="space-y-0.5">
                {relevantCategories.map(category => {
                  const isActive = category.id === activeCategory.id;
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveCategoryId(category.id)}
                        onFocus={() => setActiveCategoryId(category.id)}
                        className={`w-full flex items-center justify-between px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-left transition-colors duration-150 ${
                          isActive
                            ? 'bg-verone-gray-50 text-verone-black'
                            : 'text-verone-gray-600 hover:bg-verone-gray-50/60 hover:text-verone-black'
                        }`}
                      >
                        <span className="truncate">{category.name}</span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Pane droite : sous-catégories de la famille active en grille */}
            <div className="flex-1 py-6 px-8 overflow-y-auto">
              <div className="flex items-baseline justify-between mb-4">
                <Link
                  href={`/catalogue?categorie=${activeCategory.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-semibold text-verone-black uppercase tracking-wide hover:underline"
                >
                  {activeCategory.name}
                </Link>
                <Link
                  href={`/catalogue?categorie=${activeCategory.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-medium text-verone-gray-500 hover:text-verone-black uppercase tracking-wide"
                >
                  Voir tout ({activeCategory.subcategories.length}) →
                </Link>
              </div>

              <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {activeCategory.subcategories.map(sub => (
                  <li key={sub.id}>
                    <Link
                      href={`/catalogue?categorie=${sub.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="block py-1 text-sm text-verone-gray-600 hover:text-verone-black transition-colors duration-150"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Footer du panneau droit */}
              <div className="mt-8 pt-4 border-t border-verone-gray-100">
                <Link
                  href="/catalogue"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-verone-black hover:underline uppercase tracking-wide"
                >
                  Voir tout le catalogue →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
