'use client';

/**
 * ProductInfoCard — display read-only des infos produit côté catalogue LinkMe.
 *
 * SI-DESC-001 (2026-04-21) : retrait de l'édition custom_title /
 * custom_description / custom_selling_points (0 % d'usage prod). Les
 * informations viennent directement de la fiche produit mère — single
 * source of truth conforme best practices PIM. Edition -> onglet
 * Descriptions de `/produits/catalogue/[id]`.
 */

import Link from 'next/link';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from '@verone/ui';
import { ExternalLink, FileText } from 'lucide-react';

import type { LinkMeProductDetail } from '../types';
import { calculateCompleteness } from '../types';

interface ProductInfoCardProps {
  product: LinkMeProductDetail;
}

export function ProductInfoCard({ product }: ProductInfoCardProps) {
  const completeness = calculateCompleteness(product);
  const description = product.custom_description ?? product.source_description;
  const sellingPoints =
    product.custom_selling_points && product.custom_selling_points.length > 0
      ? product.custom_selling_points
      : (product.source_selling_points ?? []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations produit
          </CardTitle>
          <Badge
            variant={completeness.percentage === 100 ? 'success' : 'secondary'}
            className="text-sm"
          >
            {completeness.percentage}% complet
          </Badge>
        </div>
        <Progress value={completeness.percentage} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {completeness.completedCount}/{completeness.totalCount} champs validés
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <p className="mb-2">
            Les informations affichées viennent directement de la fiche produit
            principale. Pour modifier le titre, la description ou les arguments
            de vente, ouvrez la fiche produit.
          </p>
          <Link
            href={`/produits/catalogue/${product.product_id}`}
            className="inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-900 underline"
          >
            Ouvrir la fiche produit
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
            Titre
          </div>
          <p className="text-sm text-neutral-900">
            {product.custom_title ?? product.name}
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
            Description
          </div>
          {description ? (
            <p className="text-sm text-neutral-900 whitespace-pre-wrap">
              {description}
            </p>
          ) : (
            <p className="text-sm text-neutral-400 italic">Non renseignée</p>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
            Arguments de vente
          </div>
          {sellingPoints.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-neutral-900 space-y-1">
              {sellingPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400 italic">
              Aucun argument de vente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
