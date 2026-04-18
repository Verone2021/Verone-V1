'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ButtonUnified } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { Trash2, ShoppingCart, ArrowRight, Minus, Plus } from 'lucide-react';

import { useCart } from '@/contexts/CartContext';

export default function PanierPage() {
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-verone-gray-100 mb-6">
          <ShoppingCart className="h-10 w-10 text-verone-gray-400" />
        </div>
        <h1 className="text-3xl font-playfair font-bold mb-4">
          Votre panier est vide
        </h1>
        <p className="text-verone-gray-500 mb-8">
          Découvrez notre catalogue et ajoutez vos articles préférés.
        </p>
        <Link href="/catalogue">
          <ButtonUnified variant="default" size="lg" icon={ArrowRight}>
            Parcourir le catalogue
          </ButtonUnified>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-playfair font-bold">
          Mon Panier ({itemCount})
        </h1>
        <button
          onClick={() => {
            void clearCart().catch(error => {
              console.error('[PanierPage] clearCart failed:', error);
            });
          }}
          className="text-sm text-verone-gray-500 hover:text-red-600 transition-colors"
        >
          Vider le panier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste produits */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white border border-verone-gray-200 rounded-lg p-6 flex gap-4"
            >
              {/* Image */}
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-verone-gray-50 flex-shrink-0">
                {item.primary_image_url ? (
                  <Image
                    src={item.primary_image_url}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ShoppingCart className="h-8 w-8 text-verone-gray-300" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/produit/${item.slug || item.product_id}`}
                  className="font-semibold text-verone-black hover:underline truncate block"
                >
                  {item.name}
                </Link>
                {item.sku && (
                  <p className="text-sm text-verone-gray-500 mt-0.5">
                    Réf: {item.sku}
                  </p>
                )}
                {item.include_assembly && (
                  <p className="text-sm text-blue-600 mt-1">
                    + Service de montage
                  </p>
                )}

                {/* Quantity controls */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => {
                      void updateQuantity(
                        item.product_id,
                        item.quantity - 1
                      ).catch(error => {
                        console.error(
                          '[PanierPage] updateQuantity failed:',
                          error
                        );
                      });
                    }}
                    className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center border border-verone-gray-300 rounded hover:bg-verone-gray-50 transition-colors"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="h-4 w-4 md:h-3 md:w-3" />
                  </button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => {
                      void updateQuantity(
                        item.product_id,
                        item.quantity + 1
                      ).catch(error => {
                        console.error(
                          '[PanierPage] updateQuantity failed:',
                          error
                        );
                      });
                    }}
                    className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center border border-verone-gray-300 rounded hover:bg-verone-gray-50 transition-colors"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="h-4 w-4 md:h-3 md:w-3" />
                  </button>
                </div>
              </div>

              {/* Price + Remove */}
              <div className="text-right flex flex-col justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {formatPrice(
                      (item.price_ttc +
                        item.eco_participation +
                        (item.include_assembly ? item.assembly_price : 0)) *
                        item.quantity
                    )}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-verone-gray-500">
                      {formatPrice(
                        item.price_ttc +
                          item.eco_participation +
                          (item.include_assembly ? item.assembly_price : 0)
                      )}{' '}
                      / unité
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    void removeItem(item.product_id).catch(error => {
                      console.error('[PanierPage] removeItem failed:', error);
                    });
                  }}
                  className="h-11 w-11 md:h-auto md:w-auto flex items-center justify-center text-verone-gray-400 hover:text-red-600 transition-colors self-end"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-verone-gray-200 rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-playfair font-bold mb-4">
              Récapitulatif
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-verone-gray-600">
                <span>
                  Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})
                </span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-verone-gray-600">
                <span>Livraison</span>
                <span className="text-sm font-medium text-green-600">
                  Calculée au checkout
                </span>
              </div>
              <div className="border-t border-verone-gray-200 pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>
            <Link href="/checkout" className="block">
              <ButtonUnified
                variant="default"
                size="lg"
                icon={ArrowRight}
                className="w-full"
              >
                Passer commande
              </ButtonUnified>
            </Link>
            <Link
              href="/catalogue"
              className="block text-center text-sm text-verone-gray-500 hover:text-verone-black mt-4 transition-colors"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
