'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CloudflareImage } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { Search, X } from 'lucide-react';

import {
  useCatalogueProducts,
  type CatalogueProduct,
} from '@/hooks/use-catalogue-products';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: allProducts } = useCatalogueProducts();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onClose]);

  const results =
    query.length >= 2 && allProducts
      ? allProducts
          .filter(
            (p: CatalogueProduct) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              (p.manufacturer?.toLowerCase().includes(query.toLowerCase()) ??
                false) ||
              (p.sku?.toLowerCase().includes(query.toLowerCase()) ?? false)
          )
          .slice(0, 6)
      : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/catalogue?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-verone-black/50 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto mt-20 px-6">
        <div className="bg-verone-white rounded-lg shadow-2xl overflow-hidden">
          {/* Search input */}
          <form onSubmit={handleSubmit} className="flex items-center border-b">
            <Search className="h-5 w-5 text-verone-gray-400 ml-4" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="flex-1 px-4 py-4 text-sm outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-3 text-verone-gray-400 hover:text-verone-black"
            >
              <X className="h-5 w-5" />
            </button>
          </form>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {results.map(product => (
                <Link
                  key={product.product_id}
                  href={`/produit/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-verone-gray-50 transition-colors"
                >
                  <div className="relative w-12 h-12 rounded bg-verone-gray-50 flex-shrink-0">
                    <CloudflareImage
                      cloudflareId={product.primary_cloudflare_image_id ?? null}
                      fallbackSrc={product.primary_image_url}
                      alt={product.name}
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-verone-black truncate">
                      {product.name}
                    </p>
                    {product.manufacturer && (
                      <p className="text-xs text-verone-gray-500">
                        {product.manufacturer}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-verone-black">
                    {product.price_ttc
                      ? formatPrice(product.price_ttc)
                      : 'Sur demande'}
                  </p>
                </Link>
              ))}
              {query.length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      `/catalogue?q=${encodeURIComponent(query.trim())}`
                    );
                    onClose();
                  }}
                  className="w-full px-4 py-3 text-sm text-verone-gray-500 hover:bg-verone-gray-50 text-center border-t"
                >
                  Voir tous les résultats pour &laquo; {query} &raquo;
                </button>
              )}
            </div>
          )}

          {query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-verone-gray-500">
                Aucun résultat pour &laquo; {query} &raquo;
              </p>
            </div>
          )}

          {query.length < 2 && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-verone-gray-400">
                Tapez au moins 2 caractères pour rechercher
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
