/**
 * VariantsSection - Affichage variantes éligibles avec badges disponibilité
 * Affiche UNIQUEMENT les variantes publiées sur le site internet (pas toutes les variantes)
 * Use Case: Si variant_group a 16 variantes mais seulement 2 publiées → affiche 2 cards
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { Package, Loader2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

interface VariantCard {
  product_id: string;
  slug: string;
  name: string;
  sku: string;
  primary_image_url: string | null;
  price_ttc: number;
  discount_rate: number | null;
  is_eligible: boolean;
}

interface VariantsSectionProps {
  currentProductId: string;
  variantGroupId: string | null;
  eligible_variants_count: number;
}

/**
 * Section Variantes pour fiche produit site internet
 * - Récupère variantes éligibles via RPC get_site_internet_products()
 * - Affiche grid responsive avec miniatures + badges disponibilité
 * - Navigation vers fiches produits variantes
 */
export function VariantsSection({
  currentProductId,
  variantGroupId,
  eligible_variants_count,
}: VariantsSectionProps) {
  const supabase = createClient();

  // Récupérer variantes éligibles du même variant_group
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['eligible-variants', variantGroupId, currentProductId],
    queryFn: async (): Promise<VariantCard[]> => {
      if (!variantGroupId) return [];

      // Récupérer TOUTES les variantes éligibles du variant_group via RPC
      const { data, error } = await supabase.rpc('get_site_internet_products');

      if (error) {
        console.error('❌ Erreur fetch variants:', error);
        return [];
      }

      // Filtrer par variant_group_id et exclure produit actuel
      const variantsData = ((data as any[]) || [])
        .filter(
          (p: any) =>
            p.variant_group_id === variantGroupId &&
            p.product_id !== currentProductId
        )
        .map((p: any) => ({
          product_id: p.product_id,
          slug: p.slug,
          name: p.name,
          sku: p.sku,
          primary_image_url: p.primary_image_url,
          price_ttc: p.price_ttc,
          discount_rate: p.discount_rate,
          is_eligible: p.is_eligible,
        }));

      return variantsData;
    },
    enabled: !!variantGroupId && eligible_variants_count > 1,
    staleTime: 60000, // Cache 1 min
  });

  // Pas de variantes éligibles (ou seulement le produit actuel)
  if (!variantGroupId || eligible_variants_count <= 1) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-3 text-lg">
        Autres variantes disponibles
      </h3>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement variantes...
        </div>
      ) : variants.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package className="h-4 w-4" />
          Aucune autre variante disponible
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {variants.length} autre{variants.length > 1 ? 's' : ''} variante
            {variants.length > 1 ? 's' : ''} disponible
            {variants.length > 1 ? 's' : ''}
          </p>

          {/* Grid variantes */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            data-testid="variants-grid"
          >
            {variants.map(variant => (
              <Link
                key={variant.product_id}
                href={`/produit/${variant.slug}`}
                className="group"
                data-testid="variant-card"
              >
                <div className="border rounded-lg p-3 hover:shadow-lg hover:border-primary-300 transition-all duration-200">
                  {/* Miniature */}
                  <div className="relative mb-2 h-32 bg-gray-100 rounded-lg overflow-hidden">
                    {variant.primary_image_url ? (
                      <Image
                        src={variant.primary_image_url}
                        alt={variant.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        Aucune image
                      </div>
                    )}
                  </div>

                  {/* Nom variante */}
                  <div className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors mb-1">
                    {variant.name}
                  </div>

                  {/* SKU */}
                  <div className="text-xs text-gray-500 mb-1">
                    {variant.sku}
                  </div>

                  {/* Prix */}
                  <div className="text-sm font-semibold text-gray-900">
                    {variant.price_ttc.toFixed(2)} € TTC
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
