'use client';

import {
  type SelectionItem,
  type SourcedProduct,
} from '../../hooks/use-linkme-selections';
import { type LinkMeCatalogProduct } from '../../hooks/use-linkme-catalog';

type CatalogProduct = LinkMeCatalogProduct;

type SelectionWithItems = {
  items?: SelectionItem[] | null;
};

export function useSelectionProducts(
  selection: SelectionWithItems | null | undefined,
  catalogProducts: CatalogProduct[] | null | undefined,
  sourcedProducts: SourcedProduct[] | null | undefined,
  searchQuery: string
) {
  const existingProductIds = new Set(
    selection?.items?.map((i: SelectionItem) => i.product_id) ?? []
  );

  const availableCatalogProducts =
    catalogProducts?.filter(
      (p: CatalogProduct) => !existingProductIds.has(p.product_id)
    ) ?? [];

  const filteredCatalogProducts = availableCatalogProducts.filter(
    (p: CatalogProduct) =>
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableSourcedProducts =
    sourcedProducts?.filter(
      (p: SourcedProduct) => !existingProductIds.has(p.id)
    ) ?? [];

  const filteredSourcedProducts = availableSourcedProducts.filter(
    (p: SourcedProduct) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasSourcedProducts = (sourcedProducts?.length ?? 0) > 0;

  return {
    availableCatalogProducts,
    filteredCatalogProducts,
    availableSourcedProducts,
    filteredSourcedProducts,
    hasSourcedProducts,
  };
}
