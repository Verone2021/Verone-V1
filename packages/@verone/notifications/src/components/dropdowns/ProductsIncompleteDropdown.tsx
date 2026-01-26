/**
 * ProductsIncompleteDropdown - Dropdown produits incomplets pour sidebar
 * Affiche les produits catalogue avec fiches à compléter
 *
 * Design System 2026 - Minimaliste, professionnel
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Package,
  Image,
  FileText,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

import { useProductsIncompleteCount } from '../../hooks';

// Type pour les produits incomplets
interface IncompleteProduct {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  missing_fields: string[];
}

interface ProductItemProps {
  product: IncompleteProduct;
}

/**
 * Item individuel de produit incomplet
 */
function ProductItem({ product }: ProductItemProps) {
  return (
    <Link
      href={`/produits/catalogue/${product.id}`}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-all duration-150',
        'hover:bg-black/5 hover:translate-x-0.5',
        'border-l-2 border-orange-200'
      )}
    >
      {/* Icône */}
      <div className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 bg-orange-50">
        <Package className="h-4 w-4 text-orange-600" />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {product.name}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-xs text-black/60">
          <span className="font-mono">{product.sku}</span>
        </div>

        {/* Champs manquants */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {product.missing_fields.map(field => (
            <span
              key={field}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700"
            >
              {field === 'description' && <FileText className="h-2.5 w-2.5" />}
              {field === 'images' && <Image className="h-2.5 w-2.5" />}
              {field}
            </span>
          ))}
        </div>
      </div>

      {/* Flèche hover */}
      <ArrowRight
        className={cn(
          'h-4 w-4 text-black/20 transition-all duration-150',
          'group-hover:text-black group-hover:translate-x-0.5'
        )}
      />
    </Link>
  );
}

interface ProductsIncompleteDropdownProps {
  /** Trigger element (badge cliquable) */
  children: React.ReactNode;
  /** Nombre max de produits affichés */
  maxItems?: number;
  /** Callback quand dropdown s'ouvre */
  onOpen?: () => void;
  /** Côté du popover */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignement du popover */
  align?: 'start' | 'center' | 'end';
}

/**
 * Dropdown des produits incomplets
 */
export function ProductsIncompleteDropdown({
  children,
  maxItems = 5,
  onOpen,
  side = 'right',
  align = 'start',
}: ProductsIncompleteDropdownProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<IncompleteProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { count, refetch: refetchCount } = useProductsIncompleteCount();
  const supabase = createClient();

  /**
   * Fetch products when dropdown opens
   */
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('products')
        .select('id, name, sku, description')
        .eq('status', 'catalogue')
        .or('description.is.null,description.eq.')
        .order('updated_at', { ascending: false })
        .limit(maxItems);

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Enrichir avec les champs manquants
      const enrichedProducts: IncompleteProduct[] = (data || []).map((p: any) => {
        const missing: string[] = [];
        if (!p.description || p.description === '') missing.push('description');
        return {
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          description: p.description,
          missing_fields: missing,
        };
      });

      setProducts(enrichedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      console.error('[ProductsIncompleteDropdown] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  useEffect(() => {
    if (open) {
      fetchProducts();
      onOpen?.();
    }
  }, [open, fetchProducts, onOpen]);

  const handleRefresh = async () => {
    await Promise.all([fetchProducts(), refetchCount()]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-500" />
            <span className="font-semibold text-sm">Fiches incomplètes</span>
            {count > 0 && (
              <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0">
                {count}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-80">
          {loading && products.length === 0 ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                Réessayer
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">Toutes les fiches sont complètes</p>
              <p className="text-xs text-black/40 mt-1">
                Aucun produit à compléter
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {products.map(product => (
                <ProductItem key={product.id} product={product} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-4 py-2 bg-gray-50/50">
            <Link
              href="/produits/catalogue?incomplete=true"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-black hover:text-black/70 transition-colors"
              onClick={() => setOpen(false)}
            >
              Voir tous les produits
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
