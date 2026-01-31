/**
 * ProductSidebar - Sidebar sticky fiche produit (40% largeur)
 * Features:
 * - Sticky top-20
 * - Titre + Marque conditionnelle
 * - Prix TTC + Éco-participation (ligne séparée)
 * - Variantes photos 56x56px
 * - Quantité + Checkbox montage
 * - CTA "Ajouter au panier"
 * - Icône Favoris (absolute top-right)
 * - Infos réassurance (livraison, retours)
 */

'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  ButtonUnified,
  Label,
  Input,
  Checkbox,
  Separator,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { ShoppingCart, Heart, Truck, Shield, Info } from 'lucide-react';

interface ProductSidebarProps {
  product: {
    product_id: string;
    name: string;
    brand: string | null; // Afficher UNIQUEMENT si renseigné
    price_ttc: number | null;
    discount_rate: number | null;
    eco_participation_amount: number | null; // Ligne séparée sous prix
    requires_assembly: boolean | null;
    assembly_price: number | null;
    delivery_delay_weeks_min: number | null;
    delivery_delay_weeks_max: number | null;
    variant_group_id: string | null;
    eligible_variants_count: number;
  };
  variants?: Array<{
    product_id: string;
    slug: string;
    name: string;
    primary_image_url: string | null;
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
  const [isFavorite, setIsFavorite] = useState(false); // Mock state

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
      : 'Livraison sous 3-5 jours';

  return (
    <div className="lg:sticky lg:top-20 lg:h-fit">
      <div className="bg-white border rounded-lg p-6 space-y-6 relative">
        {/* Icône Favoris (absolute top-right) */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={
            isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
          }
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Titre produit */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight pr-12">
            {product.name}
          </h1>

          {/* Marque UNIQUEMENT si renseignée (pas de fallback "Vérone") */}
          {product.brand && (
            <Link
              href={`/marques/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-muted-foreground hover:underline mt-2 inline-block"
            >
              par {product.brand}
            </Link>
          )}
        </div>

        <Separator />

        {/* Prix TTC */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl md:text-4xl font-bold">
              {formatPrice(priceTTC)}
            </span>
            {hasDiscount && (
              <span className="inline-block text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                -{Math.round(product.discount_rate! * 100)}%
              </span>
            )}
          </div>

          {/* Éco-participation (ligne séparée) */}
          {ecoParticipation > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>dont Éco-participation</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-0.5 hover:bg-gray-100 rounded-full">
                    <Info className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-sm">
                  L'éco-participation finance le recyclage des meubles usagés
                  conformément à la réglementation française.
                </PopoverContent>
              </Popover>
              <span className="font-medium">
                {formatPrice(ecoParticipation)}
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">TVA incluse</p>
        </div>

        {/* Variantes (SI eligible_variants_count > 1) */}
        {product.variant_group_id && product.eligible_variants_count > 1 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Choisissez votre variante
            </Label>

            <div className="flex flex-wrap gap-2">
              {variants.map(variant => (
                <Link
                  key={variant.product_id}
                  href={`/produit/${variant.slug}`}
                  className="group relative"
                  title={variant.name}
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

                  {/* Tooltip au survol */}
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    {variant.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Quantité */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-sm font-medium">
            Quantité
          </Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={e =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-24"
          />
        </div>

        {/* Checkbox Service Montage (SI requires_assembly) */}
        {product.requires_assembly &&
          product.assembly_price &&
          product.assembly_price > 0 && (
            <div className="flex items-start gap-2">
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
                  className="text-sm font-normal cursor-pointer"
                >
                  Service de montage
                  <span className="font-medium ml-1">
                    (+{formatPrice(product.assembly_price)})
                  </span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Montage professionnel à domicile
                </p>
              </div>
            </div>
          )}

        <Separator />

        {/* Total Prix (si assembly inclus) */}
        {includeAssembly && assemblyPrice > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Total</span>
            <span className="text-lg font-bold">{formatPrice(totalPrice)}</span>
          </div>
        )}

        {/* CTA "Ajouter au panier" */}
        <ButtonUnified
          variant="default"
          size="lg"
          icon={ShoppingCart}
          className="w-full"
          onClick={() => {
            // TODO: Implémenter ajout panier
            console.warn('[ProductSidebar] Ajout panier:', {
              product_id: product.product_id,
              quantity,
              includeAssembly,
              totalPrice,
            });
          }}
        >
          Ajouter au panier
        </ButtonUnified>

        {/* Délai livraison */}
        <p className="text-sm text-muted-foreground text-center">
          {deliveryDelay}
        </p>

        <Separator />

        {/* Infos réassurance */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4 flex-shrink-0" />
            <span>Livraison suivie</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span>Retours gratuits 30 jours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
