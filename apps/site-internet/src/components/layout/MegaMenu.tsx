'use client';

import { useState, useRef, useEffect } from 'react';

import Link from 'next/link';

import { ChevronDown } from 'lucide-react';
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: categories = [] } = useCategoriesWithSubs();

  // Only show categories with products (subcategories)
  const relevantCategories = categories.filter(c => c.subcategories.length > 0);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
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

      {/* Dropdown — responsive : aligné sous le déclencheur, largeur capée à la viewport */}
      {isOpen && relevantCategories.length > 0 && (
        <div className="absolute top-full left-0 mt-4 w-[min(700px,calc(100vw-2rem))] bg-white border border-verone-gray-200 shadow-luxury-xl rounded-lg p-6 lg:p-8 z-50">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {relevantCategories.map(category => (
              <div key={category.id}>
                <Link
                  href={`/catalogue?categorie=${category.slug}`}
                  className="text-sm font-semibold text-verone-black uppercase tracking-wide hover:text-verone-gray-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {category.name}
                </Link>
                <ul className="mt-3 space-y-1.5">
                  {category.subcategories.slice(0, 8).map(sub => (
                    <li key={sub.id}>
                      <Link
                        href={`/catalogue?categorie=${sub.slug}`}
                        className="text-sm text-verone-gray-500 hover:text-verone-black transition-colors duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                  {category.subcategories.length > 8 && (
                    <li>
                      <Link
                        href={`/catalogue?categorie=${category.slug}`}
                        className="text-xs text-verone-gray-400 hover:text-verone-black transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Voir tout ({category.subcategories.length})
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer link */}
          <div className="mt-6 pt-6 border-t border-verone-gray-100 text-center">
            <Link
              href="/catalogue"
              className="text-sm font-medium text-verone-black hover:underline uppercase tracking-wide"
              onClick={() => setIsOpen(false)}
            >
              Voir tout le catalogue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
