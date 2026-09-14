import type { MutableRefObject } from 'react';

import type { Product, useCatalogue } from '@verone/categories';
import { toast } from 'sonner';

import type { useCatalogueTabs } from './use-catalogue-tabs';

type CatalogueApi = ReturnType<typeof useCatalogue>;

interface CatalogueArchiveHandlerDeps {
  tabs: ReturnType<typeof useCatalogueTabs>;
  archiveProduct: CatalogueApi['archiveProduct'];
  unarchiveProduct: CatalogueApi['unarchiveProduct'];
  loadArchivedProductsRef: MutableRefObject<
    CatalogueApi['loadArchivedProducts']
  >;
  filtersRef: MutableRefObject<Record<string, unknown>>;
}

/**
 * Retirer (motif obligatoire) / Restaurer un produit depuis la liste catalogue
 * (BO-PRODUCTS-P8-001). Renvoie true si l'action a réussi.
 */
export function createCatalogueArchiveHandler({
  tabs,
  archiveProduct,
  unarchiveProduct,
  loadArchivedProductsRef,
  filtersRef,
}: CatalogueArchiveHandlerDeps) {
  const refreshArchivedTab = async () => {
    if (tabs.activeTab !== 'archived') return;
    const result = await loadArchivedProductsRef.current(filtersRef.current);
    tabs.setArchivedProducts(result.products);
  };

  return async (product: Product, reason?: string): Promise<boolean> => {
    try {
      if (product.archived_at) {
        await unarchiveProduct(product.id);
        await refreshArchivedTab();
        toast.success('Produit restauré', {
          description: `${product.name ?? 'Ce produit'} est de nouveau actif dans le catalogue.`,
        });
        return true;
      }

      if (!reason) return false;
      await archiveProduct(product.id, reason);
      if (tabs.activeTab === 'incomplete') {
        tabs.setIncompleteProducts(prev =>
          prev.filter(p => p.id !== product.id)
        );
      }
      await refreshArchivedTab();
      toast.success('Produit retiré', {
        description: `${product.name ?? 'Ce produit'} est retiré des canaux de vente ; il pourra être restauré.`,
      });
      return true;
    } catch (error) {
      console.error('Erreur retrait / restauration produit:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : "L'action n'a pas pu être enregistrée."
      );
      return false;
    }
  };
}
