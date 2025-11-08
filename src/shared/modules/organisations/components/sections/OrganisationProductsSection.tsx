'use client';

/**
 * Section affichage produits pour une organisation
 * Utilisé dans page détail fournisseur - onglet Produits
 */

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Package, Plus, Eye, Barcode, Euro, Box } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { formatCurrency } from '@verone/utils';
import { useProducts } from '@/shared/modules/products/hooks';

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
  onUpdate,
  className,
}: OrganisationProductsSectionProps) {
  const { products, loading, refetch: fetchProducts } = useProducts();
  const [organisationProducts, setOrganisationProducts] = useState<any[]>([]);

  // Charger les produits
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtrer les produits pour cette organisation
  useEffect(() => {
    let filtered: any[] = [];

    if (organisationType === 'supplier') {
      filtered = products.filter(p => p.supplier_id === organisationId);
    }
    // Pour les clients, on pourrait filtrer autrement (commandes clients, etc.)

    setOrganisationProducts(filtered);
  }, [products, organisationId, organisationType]);

  if (loading && organisationProducts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">
          Chargement des produits...
        </div>
      </div>
    );
  }

  if (organisationProducts.length === 0) {
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
                ? `Aucun produit associé à ce fournisseur ${organisationName}.`
                : `Aucun produit trouvé pour ${organisationName}.`}
            </p>
            {organisationType === 'supplier' && (
              <ButtonV2 asChild>
                <Link href={`/catalogue/create?supplier_id=${organisationId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un produit
                </Link>
              </ButtonV2>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculer stats
  const stats = {
    total: organisationProducts.length,
    inStock: organisationProducts.filter(p => (p.stock_quantity || 0) > 0)
      .length,
    outOfStock: organisationProducts.filter(p => (p.stock_quantity || 0) === 0)
      .length,
    totalValue: organisationProducts.reduce(
      (sum, p) => sum + (p.selling_price_ht || 0) * (p.stock_quantity || 0),
      0
    ),
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produits {organisationType === 'supplier' ? 'Fournisseur' : ''}
              </CardTitle>
              <CardDescription>
                {stats.total} produit(s) • Valeur stock:{' '}
                {formatCurrency(stats.totalValue)} HT
              </CardDescription>
            </div>
            {organisationType === 'supplier' && (
              <ButtonV2 asChild>
                <Link href={`/catalogue/create?supplier_id=${organisationId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau produit
                </Link>
              </ButtonV2>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">{stats.total}</div>
              <div className="text-xs text-gray-600">Total produits</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.inStock}
              </div>
              <div className="text-xs text-gray-600">En stock</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats.outOfStock}
              </div>
              <div className="text-xs text-gray-600">Rupture</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organisationProducts.map(product => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Image produit */}
              <div className="aspect-square relative bg-gray-100 rounded-lg mb-3 overflow-hidden">
                {product.primary_image_url ? (
                  <Image
                    src={product.primary_image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Infos produit */}
              <div className="space-y-2">
                <h4 className="font-medium text-black line-clamp-2">
                  {product.name}
                </h4>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Barcode className="h-4 w-4" />
                  <span>{product.sku}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm">
                    <Euro className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-black">
                      {formatCurrency(product.selling_price_ht || 0)} HT
                    </span>
                  </div>

                  <Badge
                    variant={
                      (product.stock_quantity || 0) > 0
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={
                      (product.stock_quantity || 0) > 0
                        ? 'bg-green-100 text-green-800'
                        : ''
                    }
                  >
                    <Box className="h-3 w-3 mr-1" />
                    Stock: {product.stock_quantity || 0}
                  </Badge>
                </div>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  asChild
                >
                  <Link href={`/catalogue/${product.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </Link>
                </ButtonV2>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
