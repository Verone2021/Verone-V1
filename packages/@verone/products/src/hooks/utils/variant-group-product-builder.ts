'use client';

import type { VariantType } from '@verone/types';

import { generateProductSKU } from '@verone/products/utils';

interface GroupDataForBuild {
  name: string;
  base_sku: string;
  product_count: number | null;
  subcategory_id: string | null;
  common_dimensions: unknown;
  has_common_supplier: boolean | null;
  supplier_id: string | null;
}

/**
 * Construit l'objet d'insertion pour un nouveau produit dans un groupe de variantes.
 * Centralise la logique de nommage, SKU, dimensions et héritage fournisseur.
 */
export function buildNewProductForGroup(
  group: GroupDataForBuild,
  groupId: string,
  variantValue: string,
  variantType: VariantType
) {
  const productName = `${group.name} - ${variantValue}`;
  const sku = generateProductSKU(group.base_sku, variantValue);

  const commonDims = group.common_dimensions as {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  } | null;

  const hasDimensions =
    commonDims?.length ?? commonDims?.width ?? commonDims?.height;

  return {
    productName,
    product: {
      name: productName,
      sku,
      subcategory_id: group.subcategory_id,
      variant_group_id: groupId,
      variant_position: (group.product_count ?? 0) + 1,
      variant_attributes: { [variantType]: variantValue },
      status: 'pret_a_commander' as const,
      creation_mode: 'complete' as const,
      cost_price: 0.01,
      ...(hasDimensions &&
        commonDims && {
          dimensions: {
            length: commonDims.length ?? null,
            width: commonDims.width ?? null,
            height: commonDims.height ?? null,
            unit: commonDims.unit ?? 'cm',
          },
        }),
      ...(group.has_common_supplier &&
        group.supplier_id && {
          supplier_id: group.supplier_id,
        }),
    },
  };
}

/**
 * Vérifie l'unicité d'une valeur de variante dans la liste de produits existants.
 * Lève une erreur si un doublon est détecté.
 */
export function assertUniqueVariantValue(
  existingProducts: { variant_attributes: unknown }[],
  variantType: VariantType,
  variantValue: string
): void {
  for (const existingProduct of existingProducts) {
    const existing = existingProduct.variant_attributes as Record<
      string,
      unknown
    >;

    if (variantType === 'color' && existing?.color === variantValue) {
      throw new Error(
        `Un produit avec la couleur "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir une couleur unique.`
      );
    }
    if (variantType === 'material' && existing?.material === variantValue) {
      throw new Error(
        `Un produit avec le matériau "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir un matériau unique.`
      );
    }
  }
}
