'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Package, Calendar } from 'lucide-react';

import { getVariantTypeIcon, formatVariantType } from './variant-utils';

interface VariantGroupStatsCardsProps {
  productCount: number;
  variantType: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export function VariantGroupStatsCards({
  productCount,
  variantType,
  createdAt,
  updatedAt,
}: VariantGroupStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Produits</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{productCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Type</CardTitle>
          {getVariantTypeIcon(variantType ?? '')}
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {formatVariantType(variantType)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Créé</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {new Date(createdAt).toLocaleDateString('fr-FR')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Modifié</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {new Date(updatedAt).toLocaleDateString('fr-FR')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
