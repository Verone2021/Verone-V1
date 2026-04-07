'use client';

import { useRouter } from 'next/navigation';

import { ButtonUnified, Badge } from '@verone/ui';
import { Zap, Plus } from 'lucide-react';

interface SLOResult {
  isCompliant: boolean;
  duration: number;
}

interface CatalogueHeaderProps {
  dashboardSLO: SLOResult;
}

export function CatalogueHeader({ dashboardSLO }: CatalogueHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-light text-black">Catalogue Produits</h1>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <ButtonUnified
            onClick={() => router.push('/produits/sourcing')}
            variant="outline"
            size="sm"
            icon={Zap}
            iconPosition="left"
            className="h-8 text-xs"
          >
            Sourcing Rapide
          </ButtonUnified>

          <ButtonUnified
            onClick={() => router.push('/produits/catalogue/nouveau')}
            variant="default"
            size="sm"
            icon={Plus}
            iconPosition="left"
            className="h-8 text-xs"
          >
            Nouveau Produit
          </ButtonUnified>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={dashboardSLO.isCompliant ? 'success' : 'destructive'}>
            {dashboardSLO.duration}ms
          </Badge>
          <span className="text-xs text-black opacity-50">SLO: &lt;2s</span>
        </div>
      </div>
    </div>
  );
}
