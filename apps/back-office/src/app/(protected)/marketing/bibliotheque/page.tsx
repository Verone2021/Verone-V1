'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MediaLibraryView } from '@verone/marketing';
import { createClient } from '@verone/utils/supabase/client';
import type { BrandInfo } from '@verone/marketing';

export default function MarketingBibliothequePage() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandInfo[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('brands')
        .select('id, slug, name, brand_color')
        .eq('is_active', true)
        .order('display_order');
      setBrands((data ?? []) as BrandInfo[]);
    };
    void fetchBrands().catch(err => {
      console.error('[MarketingBibliotheque] Failed to load brands:', err);
    });
  }, []);

  // Navigation vers le produit lié via source_product_image_id
  // On redirige vers /produits/catalogue — la fiche produit se résoudra via le query param
  const handleNavigateToProduct = useCallback(
    (sourceProductImageId: string) => {
      // La page catalogue peut filtrer par image id via searchParams si nécessaire
      // Pour Phase 1, on redirige simplement vers le catalogue
      void router.push(
        `/produits/catalogue?source_image_id=${sourceProductImageId}`
      );
    },
    [router]
  );

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <MediaLibraryView
        brands={brands}
        onNavigateToProduct={handleNavigateToProduct}
      />
    </div>
  );
}
