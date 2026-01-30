/**
 * ProductAccordions - Sections accordéons détails produit
 * Features:
 * - Dimensions (L x l x H + poids)
 * - Détails du produit (description longue)
 * - Matériaux & Entretien (technical_description)
 * - Livraison & Retours
 * - Avis clients (placeholder)
 */

'use client';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@verone/ui';
import { Truck, Shield, Package } from 'lucide-react';

interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  depth?: number;
  longueur?: number;
  largeur?: number;
  hauteur?: number;
  profondeur?: number;
  unit?: string;
}

interface ProductAccordionsProps {
  product: {
    description: string | null;
    technical_description: string | null;
    dimensions: ProductDimensions | null;
    weight: number | null;
    requires_assembly: boolean | null;
  };
}

// Helper: Formatter dimensions au format L x l x H
const formatDimensions = (dims: ProductDimensions | null): string | null => {
  if (!dims) return null;

  const length = dims.length ?? dims.longueur;
  const width = dims.width ?? dims.largeur;
  const height = dims.height ?? dims.hauteur;
  const depth = dims.depth ?? dims.profondeur;
  const unit = dims.unit ?? 'cm';

  const h = height ?? depth;

  if (length && width && h) {
    return `${length} x ${width} x ${h} ${unit}`;
  }
  return null;
};

export function ProductAccordions({ product }: ProductAccordionsProps) {
  const dimensionsFormatted = formatDimensions(product.dimensions);

  return (
    <Accordion type="multiple" className="border rounded-lg">
      {/* Dimensions */}
      {(dimensionsFormatted ?? product.weight) && (
        <AccordionItem value="dimensions">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Dimensions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {dimensionsFormatted && (
                <div>
                  <p className="font-medium mb-1">{dimensionsFormatted}</p>
                  <p className="text-muted-foreground text-xs">
                    (L) x (l) x (H)
                  </p>
                </div>
              )}

              {product.weight && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Poids</span>
                  <span className="font-medium">{product.weight} kg</span>
                </div>
              )}

              {product.requires_assembly && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Montage</span>
                  <span className="font-medium">À monter soi-même</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Détails du produit */}
      {product.description && (
        <AccordionItem value="details">
          <AccordionTrigger className="px-4">
            Détails du produit
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Matériaux & Finitions */}
      {product.technical_description && (
        <AccordionItem value="materials">
          <AccordionTrigger className="px-4">
            Matériaux & Finitions
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {product.technical_description}
            </p>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Entretien (placeholder) */}
      <AccordionItem value="care">
        <AccordionTrigger className="px-4">Entretien</AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Informations d'entretien bientôt disponibles.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Livraison & Retours */}
      <AccordionItem value="delivery">
        <AccordionTrigger className="px-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>Livraison & Retours</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex items-center gap-2 font-medium mb-1">
                <Truck className="h-4 w-4 text-gray-600" />
                <span>Livraison</span>
              </div>
              <p className="text-muted-foreground pl-6">
                Livraison sous 3-5 jours ouvrés pour les produits en stock.
              </p>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center gap-2 font-medium mb-1">
                <Shield className="h-4 w-4 text-gray-600" />
                <span>Retours</span>
              </div>
              <p className="text-muted-foreground pl-6">
                Retours gratuits sous 30 jours. Le produit doit être dans son
                emballage d'origine.
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Avis clients (placeholder) */}
      <AccordionItem value="reviews">
        <AccordionTrigger className="px-4">Avis clients</AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-6 text-center text-muted-foreground text-sm">
            Les avis clients seront bientôt disponibles
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
