'use client';

// =============================================================================
// Onglet Informations — read-only catalogue produit
// SI-DESC-001 (2026-04-21) : retrait des champs custom_* éditables.
// La description / technical_description / brand / selling_points sont éditées
// UNIQUEMENT depuis la fiche produit mère (/produits/catalogue/[id] →
// onglet Descriptions). Ici on les affiche en lecture seule.
// =============================================================================

import Link from 'next/link';

import { Badge, Label } from '@verone/ui';
import { ExternalLink } from 'lucide-react';

import { PRODUCT_TYPE_LABELS, formatDimensions } from './schema';
import type { TabSharedProps } from './types';

export function TabInformations({ product }: TabSharedProps) {
  return (
    <div className="space-y-6">
      {/* Banner : descriptions gérées dans la fiche produit mère */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="font-medium text-blue-900 mb-1">
          Informations gérées dans la fiche produit
        </div>
        <p className="text-sm text-blue-700 mb-2">
          La description, la marque et les points de vente sont désormais une
          source unique dans la fiche produit principale. Modifiez-les depuis
          l&apos;onglet Descriptions du catalogue produit.
        </p>
        <Link
          href={`/produits/catalogue/${product.product_id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 underline"
        >
          Ouvrir la fiche produit
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Grille read-only : description principale */}
      <div className="space-y-4">
        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Description</Label>
          <div className="text-sm text-gray-900 mt-2 whitespace-pre-wrap">
            {product.description ?? (
              <span className="text-gray-400 italic">Non renseignée</span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Description technique</Label>
          <div className="text-sm text-gray-900 mt-2 whitespace-pre-wrap">
            {product.technical_description ?? (
              <span className="text-gray-400 italic">Non renseignée</span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Marque</Label>
          <div className="text-sm text-gray-900 mt-2">
            {product.brand ? (
              <Badge variant="secondary">{product.brand}</Badge>
            ) : (
              <span className="text-gray-400 italic">Non renseignée</span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Points de vente</Label>
          <div className="text-sm text-gray-900 mt-2">
            {product.selling_points && product.selling_points.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {product.selling_points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400 italic">Aucun point de vente</span>
            )}
          </div>
        </div>
      </div>

      {/* Grille 2 colonnes pour les autres champs read-only catalogue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Dimensions</Label>
          <div className="text-sm text-gray-900 mt-2">
            {formatDimensions(product.dimensions)}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Poids</Label>
          <div className="text-sm text-gray-900 mt-2">
            {product.weight ? (
              <span>{product.weight} kg</span>
            ) : (
              <span className="text-gray-400 italic">Non défini</span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Quantité minimale fournisseur</Label>
          <div className="text-sm text-gray-900 mt-2">
            {product.supplier_moq ? (
              <Badge variant="secondary">
                {product.supplier_moq}{' '}
                {product.supplier_moq > 1 ? 'unités' : 'unité'}
              </Badge>
            ) : (
              <Badge variant="outline">1 unité (défaut)</Badge>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Pièces compatibles</Label>
          <div className="text-sm text-gray-900 mt-2">
            {product.suitable_rooms?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {product.suitable_rooms.map((room, i) => (
                  <Badge key={i} variant="outline">
                    {room}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">Aucune</span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Sous-catégorie</Label>
          <div className="text-sm text-gray-900 mt-2">
            {product.subcategory_name ? (
              <Badge variant="secondary">{product.subcategory_name}</Badge>
            ) : (
              <span className="text-gray-400 italic">Non définie</span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <Label className="text-gray-700">Type de produit</Label>
          <div className="text-sm text-gray-900 mt-2">
            {product.product_type &&
            PRODUCT_TYPE_LABELS[product.product_type] ? (
              <Badge
                variant={PRODUCT_TYPE_LABELS[product.product_type].variant}
              >
                {PRODUCT_TYPE_LABELS[product.product_type].label}
              </Badge>
            ) : (
              <span className="text-gray-400 italic">Non défini</span>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 md:col-span-2">
          <Label className="text-gray-700">Vidéo URL</Label>
          <div className="text-sm text-gray-900 mt-2">
            {product.video_url ? (
              <a
                href={product.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Voir la vidéo
              </a>
            ) : (
              <span className="text-gray-400 italic">Aucune vidéo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
