'use client';

import type { useGoogleMerchantProducts } from '@verone/channels';

import { GoogleMerchantProductCard } from '@verone/channels';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Search, RefreshCw, Package } from 'lucide-react';

type SyncedProduct = NonNullable<
  ReturnType<typeof useGoogleMerchantProducts>['data']
>[number];

type GoogleMerchantProductsTabProps = {
  syncedProducts: SyncedProduct[];
  isLoading: boolean;
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onUpdatePrice: (productId: string, newPriceHT: number) => Promise<void>;
  onUpdateMetadata: (
    productId: string,
    metadata: { title: string; description: string }
  ) => Promise<void>;
  onResync: (productId: string) => Promise<void>;
  onHide: (productId: string) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
};

export function GoogleMerchantProductsTab({
  syncedProducts,
  isLoading,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onUpdatePrice,
  onUpdateMetadata,
  onResync,
  onHide,
  onRemove,
}: GoogleMerchantProductsTabProps): JSX.Element {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="text-black">
          Produits sur Google Merchant
        </CardTitle>
        <CardDescription>
          Gérez les produits synchronisés avec Google Shopping
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10 border-black"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-48 border-black">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
            <p className="text-gray-600 mt-2">Chargement des produits...</p>
          </div>
        ) : syncedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {syncedProducts.map(product => (
              <GoogleMerchantProductCard
                key={product.id}
                product={product}
                onUpdatePrice={onUpdatePrice}
                onUpdateMetadata={onUpdateMetadata}
                onResync={onResync}
                onHide={onHide}
                onRemove={onRemove}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Aucun produit synchronisé
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Utilisez l&apos;onglet &quot;Ajouter des Produits&quot; pour
              synchroniser votre catalogue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
