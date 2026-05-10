/**
 * ProductSidebar - Sidebar sticky fiche produit (40% largeur)
 * Features:
 * - Sticky top-20
 * - Titre + Fabricant conditionnelle
 * - Prix TTC + Éco-participation (ligne séparée)
 * - Variantes photos 60x60px
 * - Quantité stepper + Checkbox montage
 * - CTA "Ajouter au panier" charbon plein largeur
 * - Icône Favoris (absolute top-right)
 * - Infos réassurance (livraison, retours)
 *
 * Design 2026 — Bodoni / Montserrat / DM Sans, charbon / or / pearl.
 * Refonte visuelle 2026-05-11 (Stitch) — logique inchangée.
 */

'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CloudflareImage,
  Label,
  Checkbox,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { Heart, Truck, Shield, Info, Check, Minus, Plus } from 'lucide-react';

import { trackAddToCart } from '@/components/analytics/GoogleAnalytics';
import { useCart } from '@/contexts/CartContext';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useWishlist } from '@/hooks/use-wishlist';

interface ProductSidebarProps {
  product: {
    product_id: string;
    name: string;
    slug: string;
    manufacturer: string | null;
    price_ttc: number | null;
    discount_rate: number | null;
    eco_participation_amount: number | null;
    requires_assembly: boolean | null;
    assembly_price: number | null;
    delivery_delay_weeks_min: number | null;
    delivery_delay_weeks_max: number | null;
    variant_group_id: string | null;
    eligible_variants_count: number;
    primary_image_url: string | null;
    primary_cloudflare_image_id: string | null;
    sku: string | null;
  };
  variants?: Array<{
    product_id: string;
    slug: string;
    name: string;
    primary_image_url: string | null;
    primary_cloudflare_image_id: string | null;
  }>;
  currentProductId: string;
}

export function ProductSidebar({
  product,
  variants = [],
  currentProductId,
}: ProductSidebarProps) {
  const [quantity, setQuantity] = useState(1);
  const [includeAssembly, setIncludeAssembly] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuthUser();
  const {
    isInWishlist,
    toggle: toggleWishlist,
    isToggling,
  } = useWishlist(user?.id);
  const router = useRouter();

  const isFavorite = isInWishlist(product.product_id);

  // Prix calculé avec éco-participation
  const hasDiscount =
    product.discount_rate != null && product.discount_rate > 0;
  const priceTTC = product.price_ttc ?? 0;
  const ecoParticipation = product.eco_participation_amount ?? 0;
  const assemblyPrice = includeAssembly ? (product.assembly_price ?? 0) : 0;
  const totalPrice = priceTTC + ecoParticipation + assemblyPrice;

  // Délai livraison
  const deliveryDelay =
    product.delivery_delay_weeks_min && product.delivery_delay_weeks_max
      ? `Livré en ${product.delivery_delay_weeks_min}-${product.delivery_delay_weeks_max} semaines`
      : 'Livraison sous 10-14 jours ouvrés';

  return (
    <div className="lg:sticky lg:top-20 lg:h-fit">
      <div className="relative space-y-8 pt-4 lg:pt-12">
        {/* Icône Favoris (absolute top-right) */}
        <button
          type="button"
          disabled={isToggling}
          onClick={() => {
            if (!user) {
              router.push('/auth/login');
              return;
            }
            toggleWishlist(product.product_id);
          }}
          className="absolute right-0 top-0 p-2 transition-colors duration-[180ms] ease-editorial hover:text-verone-or disabled:opacity-50"
          aria-label={
            isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
          }
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite ? 'fill-verone-or text-verone-or' : 'text-verone-pearl'
            }`}
          />
        </button>

        {/* Header Info */}
        <div className="space-y-3">
          {product.manufacturer && (
            <span className="block font-montserrat text-[12px] uppercase tracking-[0.18em] text-verone-pearl">
              par {product.manufacturer}
            </span>
          )}

          <h1 className="pr-12 font-bodoni text-[28px] font-black leading-tight text-verone-charbon md:text-[32px]">
            {product.name}
          </h1>

          {/* Prix TTC */}
          <div className="flex flex-wrap items-baseline gap-3 pt-2">
            <span className="font-montserrat text-[24px] font-bold tabular-nums text-verone-charbon">
              {formatPrice(priceTTC)}
            </span>
            {hasDiscount && (
              <span className="bg-verone-charbon px-2 py-1 font-montserrat text-[11px] font-semibold uppercase tracking-[0.16em] text-verone-or">
                -{Math.round(product.discount_rate! * 100)}%
              </span>
            )}
          </div>

          {/* Éco-participation (ligne séparée) */}
          {ecoParticipation > 0 && (
            <div className="flex items-center gap-1 font-montserrat text-[12px] text-verone-pearl">
              <span>dont Éco-participation</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-0.5 transition-colors hover:text-verone-charbon"
                    aria-label="Info éco-participation"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-sm">
                  L&apos;éco-participation finance le recyclage des meubles
                  usagés conformément à la réglementation française.
                </PopoverContent>
              </Popover>
              <span className="font-medium text-verone-charbon">
                {formatPrice(ecoParticipation)}
              </span>
            </div>
          )}

          <p className="font-montserrat text-[12px] text-verone-pearl">
            TVA incluse
          </p>

          {/* Stock status */}
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-montserrat text-[12px] text-verone-charbon">
              En stock
            </span>
          </div>
        </div>

        {/* Variantes (SI eligible_variants_count > 1) */}
        {product.variant_group_id && product.eligible_variants_count > 1 && (
          <div className="space-y-4 border-t border-verone-pearl-soft pt-6">
            <Label className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-charbon">
              Choisis ta variante
            </Label>

            <div className="flex flex-wrap gap-3">
              {variants.map(variant => {
                const isActive = currentProductId === variant.product_id;
                return (
                  <Link
                    key={variant.product_id}
                    href={`/produit/${variant.slug}`}
                    className="group relative"
                    title={variant.name}
                  >
                    <div
                      className={`relative h-[60px] w-[60px] overflow-hidden transition-all duration-[180ms] ease-editorial ${
                        isActive
                          ? 'ring-2 ring-verone-charbon ring-offset-2'
                          : 'ring-1 ring-verone-pearl-soft hover:ring-verone-pearl'
                      }`}
                    >
                      <CloudflareImage
                        cloudflareId={variant.primary_cloudflare_image_id}
                        fallbackSrc={variant.primary_image_url}
                        alt={variant.name}
                        fill
                        className="bg-verone-white object-contain p-1"
                        sizes="60px"
                      />
                    </div>

                    {/* Tooltip au survol */}
                    <span className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-verone-charbon px-3 py-1.5 font-montserrat text-[11px] text-verone-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                      {variant.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantité — stepper */}
        <div className="space-y-3 border-t border-verone-pearl-soft pt-6">
          <Label
            htmlFor="quantity"
            className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-charbon"
          >
            Quantité
          </Label>
          <div className="inline-flex items-center border border-verone-pearl-soft">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-verone-charbon transition-colors duration-[180ms] ease-editorial hover:bg-verone-pearl-soft"
              aria-label="Diminuer la quantité"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={e =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-12 border-0 bg-transparent p-0 text-center font-montserrat text-[14px] tabular-nums text-verone-charbon focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="flex h-10 w-10 items-center justify-center text-verone-charbon transition-colors duration-[180ms] ease-editorial hover:bg-verone-pearl-soft"
              aria-label="Augmenter la quantité"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Checkbox Service Montage (SI requires_assembly) */}
        {product.requires_assembly &&
          product.assembly_price &&
          product.assembly_price > 0 && (
            <div className="flex items-start gap-3 border-t border-verone-pearl-soft pt-6">
              <Checkbox
                id="assembly"
                checked={includeAssembly}
                onCheckedChange={checked =>
                  setIncludeAssembly(checked as boolean)
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="assembly"
                  className="cursor-pointer font-montserrat text-[14px] text-verone-charbon"
                >
                  Service de montage
                  <span className="ml-1 font-medium">
                    (+{formatPrice(product.assembly_price)})
                  </span>
                </Label>
                <p className="mt-0.5 font-montserrat text-[12px] text-verone-pearl">
                  Montage professionnel à domicile
                </p>
              </div>
            </div>
          )}

        {/* Total Prix (si assembly inclus) */}
        {includeAssembly && assemblyPrice > 0 && (
          <div className="flex items-center justify-between border-t border-verone-pearl-soft pt-6">
            <span className="font-montserrat text-[14px] text-verone-charbon">
              Total
            </span>
            <span className="font-montserrat text-[18px] font-bold tabular-nums text-verone-charbon">
              {formatPrice(totalPrice)}
            </span>
          </div>
        )}

        {/* CTA "Ajouter au panier" — charbon plein largeur */}
        <button
          type="button"
          onClick={() => {
            void addItem({
              product_id: product.product_id,
              variant_group_id: product.variant_group_id,
              quantity,
              include_assembly: includeAssembly,
              name: product.name,
              slug: product.slug,
              price_ttc: priceTTC,
              assembly_price: product.assembly_price ?? 0,
              eco_participation: ecoParticipation,
              primary_image_url: product.primary_image_url,
              primary_cloudflare_image_id: product.primary_cloudflare_image_id,
              sku: product.sku,
            })
              .then(() => {
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 2000);
                trackAddToCart({
                  id: product.product_id,
                  name: product.name,
                  price: priceTTC,
                  quantity,
                });
              })
              .catch(error => {
                console.error('[ProductSidebar] Ajout panier failed:', error);
              });
          }}
          className="flex w-full items-center justify-center gap-2 bg-verone-charbon px-6 py-4 font-montserrat text-[14px] font-medium uppercase tracking-[0.16em] text-verone-white transition-all duration-[180ms] ease-editorial hover:shadow-[inset_0_0_0_1px_#C9A961]"
        >
          {addedToCart ? (
            <>
              <Check className="h-4 w-4" />
              Ajouté au panier
            </>
          ) : (
            <>Ajouter au panier</>
          )}
        </button>

        {/* Délai livraison */}
        <p className="text-center font-montserrat text-[13px] text-verone-pearl">
          {deliveryDelay}
        </p>

        {/* Infos réassurance */}
        <div className="space-y-3 border-t border-verone-pearl-soft pt-6 font-montserrat text-[13px]">
          <div className="flex items-center gap-2 text-verone-pearl">
            <Truck className="h-4 w-4 flex-shrink-0" />
            <span>Livraison suivie</span>
          </div>
          <div className="flex items-center gap-2 text-verone-pearl">
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span>Retours gratuits 30 jours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
