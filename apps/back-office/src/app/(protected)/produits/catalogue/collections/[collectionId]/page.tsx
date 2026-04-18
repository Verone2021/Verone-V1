'use client';

import { use, useState, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useCollection, useCollections } from '@verone/collections';
import { useToast } from '@verone/common';
import type { SelectedProduct } from '@verone/products';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import { ChevronLeft, Package } from 'lucide-react';

import { CollectionFieldDescription } from './components/CollectionFieldDescription';
import { CollectionFieldName } from './components/CollectionFieldName';
import { CollectionFieldRooms } from './components/CollectionFieldRooms';
import { CollectionFieldSeo } from './components/CollectionFieldSeo';
import { CollectionFieldStyle } from './components/CollectionFieldStyle';
import { CollectionFieldTags } from './components/CollectionFieldTags';
import { CollectionKpiCards } from './components/CollectionKpiCards';
import { CollectionPageHeader } from './components/CollectionPageHeader';
import { CollectionProductsModal } from './components/CollectionProductsModal';
import { CollectionProductsSection } from './components/CollectionProductsSection';
import { CollectionSharingCard } from './components/CollectionSharingCard';

interface CollectionDetailPageProps {
  params: Promise<{
    collectionId: string;
  }>;
}

export default function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { collectionId } = use(params);
  const { collection, loading, error, refetch } = useCollection(collectionId);
  const {
    removeProductFromCollection,
    updateCollection,
    addProductsToCollection,
  } = useCollections();
  const [showManageProductsModal, setShowManageProductsModal] = useState(false);

  const handleRemoveProduct = useCallback(
    async (productId: string, productName: string) => {
      const confirmed = window.confirm(
        `Voulez-vous retirer "${productName}" de cette collection ?`
      );
      if (!confirmed) return;

      const success = await removeProductFromCollection(
        collectionId,
        productId
      );
      if (success) {
        toast({
          title: 'Produit retiré',
          description: `"${productName}" a été retiré de la collection`,
        });
        void refetch().catch(error => {
          console.error('[Collections] Refetch failed:', error);
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de retirer le produit',
          variant: 'destructive',
        });
      }
    },
    [collectionId, removeProductFromCollection, toast, refetch]
  );

  const handleSelectProducts = useCallback(
    async (products: SelectedProduct[]) => {
      if (!collection) {
        toast({
          title: 'Erreur',
          description: 'Aucune collection sélectionnée',
          variant: 'destructive',
        });
        return;
      }

      try {
        const productIds = products.map(p => p.id);
        const success = await addProductsToCollection(
          collection.id,
          productIds
        );

        if (success) {
          toast({
            title: 'Produits ajoutés',
            description: `${products.length} produit(s) ajouté(s) à "${collection.name}"`,
          });
          await refetch();
        } else {
          toast({
            title: 'Erreur',
            description: "Erreur lors de l'ajout des produits",
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('[VÉRONE:ERROR]', {
          component: 'CollectionDetailPage',
          action: 'addProductsToCollection',
          error: err instanceof Error ? err.message : 'Unknown error',
          context: {
            collectionId: collection.id,
            productCount: products.length,
          },
          timestamp: new Date().toISOString(),
        });
        toast({
          title: 'Erreur',
          description: "Erreur lors de l'ajout des produits",
          variant: 'destructive',
        });
      } finally {
        setShowManageProductsModal(false);
      }
    },
    [collection, addProductsToCollection, toast, refetch]
  );

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="w-full px-4 py-6">
        <ButtonV2
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </ButtonV2>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Collection introuvable
          </h2>
          <p className="text-gray-600">
            {error ?? "Cette collection n'existe pas ou a été supprimée."}
          </p>
        </div>
      </div>
    );
  }

  const fieldProps = {
    collection,
    collectionId,
    updateCollection,
    refetch,
    toast,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <CollectionPageHeader collection={collection} />

      <CollectionKpiCards collection={collection} />

      {/* Card compacte avec édition inline - Pattern 2025 comme Variantes */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">
          Informations de la collection
        </h3>

        {/* GROUPE 1: Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-gray-100">
          <CollectionFieldName {...fieldProps} />
          <CollectionFieldDescription {...fieldProps} />
        </div>

        {/* GROUPE 2: Style & Catégorisation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-gray-100">
          <CollectionFieldStyle {...fieldProps} />
          <CollectionFieldRooms {...fieldProps} />
          <CollectionFieldTags {...fieldProps} />
        </div>

        {/* GROUPE 3: SEO & Métadonnées */}
        <CollectionFieldSeo {...fieldProps} />
      </Card>

      <CollectionSharingCard collection={collection} />

      <CollectionProductsSection
        collection={collection}
        onManageProducts={() => setShowManageProductsModal(true)}
        onRemoveProduct={handleRemoveProduct}
      />

      {showManageProductsModal && collection && (
        <CollectionProductsModal
          open={showManageProductsModal}
          onClose={() => {
            setShowManageProductsModal(false);
            void refetch().catch(err => {
              console.error('[Collections] Refetch failed:', err);
            });
          }}
          onSelect={handleSelectProducts}
        />
      )}
    </div>
  );
}
