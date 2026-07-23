'use client';

/**
 * Vue catalogue public LinkMe — grille filtrable par catégorie.
 *
 * - Produits phares (`isFeatured`) mis en avant en tête, en vue « Tous ».
 * - Filtre par catégorie via une barre de pastilles (client, sans rechargement).
 * - Aucun prix nulle part (réservés aux comptes connectés).
 * - État vide présentable si aucun produit coché (pas de faux produits d'exemple).
 *
 * @module produits/ProductsCatalogView
 * @since 2026-07-23 - LM-PUB-CATALOG-001
 */

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { ArrowRight, PackageOpen, Sparkles } from 'lucide-react';

import type { PublicProduct } from '@/lib/linkme-public-products';

import { PublicProductCard } from './PublicProductCard';

const ALL = '__all__';
const UNCATEGORIZED = 'Autres';

interface ProductsCatalogViewProps {
  products: PublicProduct[];
}

export function ProductsCatalogView({
  products,
}: ProductsCatalogViewProps): JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  // Liste ordonnée des catégories présentes (dédupliquées).
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(p.category ?? UNCATEGORIZED);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [products]);

  const featured = useMemo(
    () => products.filter(p => p.isFeatured),
    [products]
  );

  // Produits groupés par catégorie, en respectant l'ordre reçu (phares d'abord).
  const byCategory = useMemo(() => {
    const map = new Map<string, PublicProduct[]>();
    for (const p of products) {
      const key = p.category ?? UNCATEGORIZED;
      const list = map.get(key);
      if (list) list.push(p);
      else map.set(key, [p]);
    }
    return map;
  }, [products]);

  if (products.length === 0) {
    return <EmptyState />;
  }

  const showAll = activeCategory === ALL;
  const visibleCategories = showAll ? categories : [activeCategory];

  return (
    <div>
      {/* Barre de filtres par catégorie */}
      <div className="sticky top-16 z-30 -mx-4 mb-10 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-full sm:border sm:px-3 sm:shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:justify-center sm:pb-0">
          <CategoryPill
            label="Tous"
            active={showAll}
            onClick={() => setActiveCategory(ALL)}
          />
          {categories.map(cat => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Section phares — uniquement en vue « Tous » */}
      {showAll && featured.length > 0 && (
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#5DBEBB]" />
            <h2 className="text-2xl font-bold text-[#183559]">
              Nos coups de cœur
            </h2>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}

      {/* Sections par catégorie */}
      {visibleCategories.map(cat => {
        const items = byCategory.get(cat) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mb-14">
            <h2 className="mb-6 text-2xl font-bold text-[#183559]">{cat}</h2>
            <ProductGrid products={items} />
          </section>
        );
      })}
    </div>
  );
}

function ProductGrid({ products }: { products: PublicProduct[] }): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map(product => (
        <PublicProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors md:h-9 ${
        active
          ? 'bg-[#183559] text-white'
          : 'bg-gray-100 text-[#183559]/70 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * État vide — aucun produit coché. Reste présentable, invite au contact.
 * Ne JAMAIS afficher de faux produits d'exemple (donnée fantôme).
 */
function EmptyState(): JSX.Element {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#5DBEBB]/10">
        <PackageOpen className="h-8 w-8 text-[#5DBEBB]" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-[#183559]">
        Le catalogue arrive
      </h2>
      <p className="mb-8 text-[#183559]/60">
        Nous préparons une sélection de produits à découvrir. Laisse-nous tes
        coordonnées pour être prévenu·e dès son ouverture.
      </p>
      <Link
        href="/contact"
        className="inline-flex items-center gap-2 rounded-xl bg-[#183559] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#183559]/90"
      >
        Nous contacter
        <ArrowRight className="h-5 w-5" />
      </Link>
    </div>
  );
}
