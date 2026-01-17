'use client';

/**
 * Composant: ProductHeaderSection
 * En-tête de la page détail produit avec actions principales
 */

import Link from 'next/link';

import { Badge, ButtonV2, Switch } from '@verone/ui';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { useTogglePublish } from '../../../hooks/use-toggle-publish';
import type { SiteInternetProduct } from '../../../types';

interface ProductHeaderSectionProps {
  product: SiteInternetProduct;
}

export default function ProductHeaderSection({
  product,
}: ProductHeaderSectionProps) {
  const togglePublish = useTogglePublish();

  const handleTogglePublish = (checked: boolean) => {
    togglePublish.mutate({
      product_id: product.product_id,
      is_published: checked,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        {/* Gauche: Titre + Infos */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <Badge
              variant={product.status === 'active' ? 'success' : 'default'}
            >
              {product.status === 'active' ? 'Actif' : 'Brouillon'}
            </Badge>
            {product.is_published && (
              <Badge variant="default">Publié en ligne</Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              <span className="font-medium text-gray-700">SKU:</span>{' '}
              {product.sku}
            </span>
            {product.publication_date && (
              <span>
                <span className="font-medium text-gray-700">Publié le:</span>{' '}
                {new Date(product.publication_date).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        {/* Droite: Actions */}
        <div className="flex items-center gap-3">
          {/* Toggle Publier */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-gray-700">
              Publier en ligne
            </span>
            <Switch
              checked={product.is_published}
              onCheckedChange={handleTogglePublish}
              disabled={togglePublish.isPending}
            />
          </div>

          {/* Retour liste */}
          <Link href="/canaux-vente/site-internet">
            <ButtonV2 variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </ButtonV2>
          </Link>

          {/* Aperçu (futur) */}
          <ButtonV2
            variant="outline"
            size="sm"
            disabled
            title="Aperçu bientôt disponible"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Aperçu
          </ButtonV2>
        </div>
      </div>

      {/* Alertes éligibilité */}
      {!product.is_eligible && product.ineligibility_reasons.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            ⚠️ Produit non éligible à la publication
          </h3>
          <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
            {product.ineligibility_reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
