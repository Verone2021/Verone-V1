'use client';

import type { SourcingProduct } from '@verone/products';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { AlertCircle, Package } from 'lucide-react';

import { SourcingProductRow } from './SourcingProductRow';

interface SourcingProductListProps {
  products: SourcingProduct[];
  loading: boolean;
  error: string | null;
  onView: (id: string) => void;
  onViewSupplier: (supplierId: string) => void;
  onEdit: (id: string) => void;
  onValidate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SourcingProductList({
  products,
  loading,
  error,
  onView,
  onViewSupplier,
  onEdit,
  onValidate,
  onArchive,
  onDelete,
}: SourcingProductListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: colors.text.DEFAULT }}>
          Produits à Sourcer ({products.length})
        </CardTitle>
        <CardDescription>
          Liste complète des demandes de sourcing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-8">
            <Package
              className="h-12 w-12 mx-auto mb-4 animate-spin"
              style={{ color: colors.text.muted }}
            />
            <p style={{ color: colors.text.subtle }}>
              Chargement des produits...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertCircle
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: colors.danger[500] }}
            />
            <p style={{ color: colors.danger[500] }}>Erreur: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {products.map(product => (
              <SourcingProductRow
                key={product.id}
                product={product}
                onView={() => onView(product.id)}
                onViewSupplier={
                  product.supplier_id
                    ? () => onViewSupplier(product.supplier_id!)
                    : undefined
                }
                onEdit={() => onEdit(product.id)}
                onValidate={() => onValidate(product.id)}
                onArchive={() => onArchive(product.id)}
                onDelete={() => onDelete(product.id)}
              />
            ))}

            {products.length === 0 && (
              <div className="text-center py-8">
                <Package
                  className="h-12 w-12 mx-auto mb-4"
                  style={{ color: colors.text.muted }}
                />
                <p style={{ color: colors.text.subtle }}>
                  Aucun produit trouvé
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  Essayez de modifier vos filtres ou créez votre premier produit
                  sourcing
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
