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
 * - Affiche UNIQUEMENT photos 56x56px cliquables (sans texte)
 * - Tooltip au survol pour nom variante
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
      // Type pour les données RPC
      interface RPCProduct {
        product_id: string;
        slug: string;
        name: string;
        sku: string;
        primary_image_url: string | null;
        price_ttc: number;
        discount_rate: number | null;
        is_eligible: boolean;
        variant_group_id: string | null;
      }

      const variantsData = ((data as RPCProduct[]) || [])
        .filter(
          (p: RPCProduct) =>
            p.variant_group_id === variantGroupId &&
            p.product_id !== currentProductId
        )
        .map((p: RPCProduct) => ({
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
          <p className="text-sm text-gray-600 mb-3">
            {variants.length} autre{variants.length > 1 ? 's' : ''} variante
            {variants.length > 1 ? 's' : ''} disponible
            {variants.length > 1 ? 's' : ''}
          </p>

          {/* Flex wrap variantes photo-only ultra compactes (56x56px) */}
          <div className="flex flex-wrap gap-2" data-testid="variants-grid">
            {variants.map(variant => (
              <Link
                key={variant.product_id}
                href={`/produit/${variant.slug}`}
                className="group relative"
                data-testid="variant-card"
                title={variant.name} // Accessibilité
              >
                {/* Photo 56x56px avec border active state */}
                <div
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    currentProductId === variant.product_id
                      ? 'border-gray-900 ring-2 ring-gray-200'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {variant.primary_image_url ? (
                    <Image
                      src={variant.primary_image_url}
                      alt={variant.name}
                      fill
                      className="object-contain p-1 bg-white"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50 text-gray-300 text-xs">
                      ?
                    </div>
                  )}
                </div>

                {/* Tooltip au survol - apparaît au-dessus */}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-lg">
                  {variant.name}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
