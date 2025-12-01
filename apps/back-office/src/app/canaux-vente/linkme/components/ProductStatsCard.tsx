'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Eye, MousePointer, Hash, BarChart3 } from 'lucide-react';

import type { LinkMeProductDetail } from '../types';

interface ProductStatsCardProps {
  product: LinkMeProductDetail;
}

export function ProductStatsCard({ product }: ProductStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Statistiques
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Vues */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Eye className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{product.views_count}</p>
            <p className="text-xs text-muted-foreground">Vues</p>
          </div>

          {/* Sélections */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <MousePointer className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{product.selections_count}</p>
            <p className="text-xs text-muted-foreground">Sélections</p>
          </div>

          {/* Ordre d'affichage */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Hash className="h-6 w-6 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{product.display_order}</p>
            <p className="text-xs text-muted-foreground">Position</p>
          </div>
        </div>

        {/* Taux de conversion */}
        {product.views_count > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-center">
              <span className="font-medium">Taux de sélection :</span>{' '}
              <span className="font-bold">
                {(
                  (product.selections_count / product.views_count) *
                  100
                ).toFixed(1)}
                %
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
