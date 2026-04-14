'use client';

/**
 * Section affichage produits pour une organisation
 * Utilisé dans page détail fournisseur - onglet Produits
 */

import { useEffect, useState, useCallback } from 'react';

import Link from 'next/link';

import { Package, Plus, Eye, Barcode, Euro, Box } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@verone/ui';
import { formatCurrency, createClient } from '@verone/utils';

interface OrganisationProduct {
  id: string;
  name: string;
  sku: string;
  cost_price: number | null;
  stock_quantity: number | null;
  product_status: string;
  sourcing_status: string | null;
  image_url: string | null;
}

interface OrganisationProductsSectionProps {
  organisationId: string;
  organisationName: string;
  organisationType: 'supplier' | 'customer';
  onUpdate?: () => void;
  className?: string;
}

export function OrganisationProductsSection({
  organisationId,
  organisationName,
  organisationType,
  onUpdate: _onUpdate,
  className: _className,
}: OrganisationProductsSectionProps) {
  const [products, setProducts] = useState<OrganisationProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Charger les produits avec image principale (product_images OU sourcing_photos)
    const { data } = await supabase
      .from('products')
      .select(
        `id, name, sku, cost_price, stock_quantity, product_status, sourcing_status,
         product_images!left(public_url, is_primary),
         sourcing_photos!left(public_url, sort_order)`
      )
      .eq('supplier_id', organisationId)
      .order('created_at', { ascending: false });

    if (data) {
      const mapped: OrganisationProduct[] = data.map(
        (p: Record<string, unknown>) => {
          // Image : product_images d'abord, sourcing_photos en fallback
          const productImgs =
            (p.product_images as Array<{
              public_url: string | null;
              is_primary: boolean;
            }>) ?? [];
          const sourcingPhotos =
            (p.sourcing_photos as Array<{
              public_url: string | null;
              sort_order: number;
            }>) ?? [];

          const primaryImg = productImgs.find(img => img.is_primary);
          const imageUrl =
            primaryImg?.public_url ??
            productImgs[0]?.public_url ??
            sourcingPhotos[0]?.public_url ??
            null;

          return {
            id: p.id as string,
            name: p.name as string,
            sku: p.sku as string,
            cost_price: p.cost_price as number | null,
            stock_quantity: p.stock_quantity as number | null,
            product_status: p.product_status as string,
            sourcing_status: p.sourcing_status as string | null,
            image_url: imageUrl,
          };
        }
      );
      setProducts(mapped);
    }
    setLoading(false);
  }, [organisationId]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">
          Chargement des produits...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Aucun produit
            </h3>
            <p className="text-gray-600 mb-6">
              {organisationType === 'supplier'
                ? `Aucun produit associe a ${organisationName}.`
                : `Aucun produit trouve pour ${organisationName}.`}
            </p>
            {organisationType === 'supplier' && (
              <ButtonV2 asChild>
                <Link href={`/catalogue/create?supplier_id=${organisationId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Creer un produit
                </Link>
              </ButtonV2>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    total: products.length,
    inStock: products.filter(p => (p.stock_quantity ?? 0) > 0).length,
    outOfStock: products.filter(p => (p.stock_quantity ?? 0) === 0).length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                Produits
              </CardTitle>
              <CardDescription>{stats.total} produit(s)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => {
              const isSourcing = product.product_status === 'draft';
              const detailUrl = isSourcing
                ? `/produits/sourcing/produits/${product.id}`
                : `/catalogue/${product.id}`;

              return (
                <Link
                  key={product.id}
                  href={detailUrl}
                  className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  {/* Infos */}
                  <div className="p-3 space-y-1">
                    <p
                      className="text-xs font-medium text-black truncate"
                      title={product.name}
                    >
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>{product.sku}</span>
                      {isSourcing && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0"
                        >
                          Sourcing
                        </Badge>
                      )}
                    </div>
                    {product.cost_price && (
                      <p className="text-xs font-semibold text-black">
                        {formatCurrency(product.cost_price)} HT
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
