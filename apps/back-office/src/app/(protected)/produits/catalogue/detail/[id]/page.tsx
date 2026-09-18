'use client';

import dynamic from 'next/dynamic';

import { TabsNavigation, TabContent } from '@verone/ui';

import { ProductDetailHeader } from './_components/product-detail-header';
import { ProductGeneralTab } from './_components/product-general-tab';
import { ProductLoadingState } from './_components/ProductLoadingState';
import { ProductModals } from './_components/ProductModals';
import { useProductDetail } from './_components/hooks/use-product-detail';
import { ProductWithdrawActions } from '../../_components/ProductWithdrawActions';

/*
 * Les six onglets secondaires sont charges a la demande. [BO-PROD-DETAIL-404-006]
 *
 * Deux raisons, dans cet ordre :
 *
 * 1. Cette route disparaissait de la sortie du deploiement Vercel — compilee,
 *    listee par `next build`, jamais livree, donc 404 sur les 218 produits
 *    depuis tous les ecrans. Une experience a deux sondes (2026-09-18) a montre
 *    que la route redevient livree des que le morceau propre de `page.tsx`
 *    cesse d'etre un bloc de 43 kB. Aucune autre des 166 routes n'approchait ce
 *    volume, et c'est la seule qui tombait.
 * 2. `TabContent` renvoie `null` quand l'onglet n'est pas actif : le code de ces
 *    six onglets etait donc telecharge sans jamais etre affiche. 2,21 Mo au
 *    premier chargement pour un ecran dont on ne voit qu'un septieme.
 *
 * L'onglet « General » reste charge d'emblee : c'est celui qui s'ouvre.
 */
const tabLoader = () => (
  <div className="py-6 text-sm text-neutral-500">Chargement…</div>
);

const ProductDescriptionsTab = dynamic(
  () =>
    import('./_components/product-descriptions-tab').then(
      m => m.ProductDescriptionsTab
    ),
  { loading: tabLoader }
);
const ProductPricingTab = dynamic(
  () =>
    import('./_components/product-pricing-tab').then(m => m.ProductPricingTab),
  { loading: tabLoader }
);
const ProductStockTab = dynamic(
  () => import('./_components/product-stock-tab').then(m => m.ProductStockTab),
  { loading: tabLoader }
);
const ProductCharacteristicsTab = dynamic(
  () =>
    import('./_components/product-characteristics-tab').then(
      m => m.ProductCharacteristicsTab
    ),
  { loading: tabLoader }
);
const ProductImagesTab = dynamic(
  () =>
    import('./_components/product-images-tab').then(m => m.ProductImagesTab),
  { loading: tabLoader }
);
const ProductPublicationTab = dynamic(
  () =>
    import('./_components/product-publication-tab').then(
      m => m.ProductPublicationTab
    ),
  { loading: tabLoader }
);

export default function ProductDetailPage() {
  const {
    product,
    loading,
    error,
    activeTab,
    setActiveTab,
    showPhotosModal,
    setShowPhotosModal,
    showDescriptionsModal,
    setShowDescriptionsModal,
    isCategorizeModalOpen,
    setIsCategorizeModalOpen,
    productImages,
    _primaryImage,
    breadcrumbParts,
    completionPercentage,
    sourcing,
    primaryImageUrl,
    tabs,
    fetchProduct,
    refreshHeaderImages,
    handleProductUpdate,
    handleShare,
    router,
  } = useProductDetail();

  if (loading || (!product && !error)) {
    return (
      <ProductLoadingState
        loading={loading}
        error={null}
        onBack={() => router.back()}
      />
    );
  }

  if (error || !product) {
    return (
      <ProductLoadingState
        loading={false}
        error={error}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <ProductDetailHeader
        product={product}
        breadcrumbParts={breadcrumbParts}
        completionPercentage={completionPercentage}
        primaryImageUrl={primaryImageUrl}
        sourcing={sourcing}
        onBack={() => router.back()}
        onShare={handleShare}
        onImageClick={() => setShowPhotosModal(true)}
        extraActions={
          <ProductWithdrawActions
            productId={product.id}
            isWithdrawn={Boolean(product.archived_at)}
            onChanged={() => fetchProduct({ silent: true })}
          />
        }
      />

      <div className="w-full px-4">
        <TabsNavigation
          tabs={tabs}
          defaultTab="general"
          onTabChange={setActiveTab}
          className="bg-white"
        />

        <TabContent activeTab={activeTab} tabId="general">
          <ProductGeneralTab
            product={product}
            completionPercentage={completionPercentage}
            onProductUpdate={handleProductUpdate}
            onTabChange={setActiveTab}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="descriptions">
          <ProductDescriptionsTab
            product={product}
            onProductUpdate={handleProductUpdate}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="pricing">
          <ProductPricingTab
            product={product}
            completionPercentage={completionPercentage}
            onProductUpdate={handleProductUpdate}
            onTabChange={setActiveTab}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="stock">
          <ProductStockTab
            product={product}
            completionPercentage={completionPercentage}
            onProductUpdate={handleProductUpdate}
            onTabChange={setActiveTab}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="characteristics">
          <ProductCharacteristicsTab
            product={product}
            completionPercentage={completionPercentage}
            onProductUpdate={handleProductUpdate}
            onTabChange={setActiveTab}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="images">
          <ProductImagesTab
            product={product}
            completionPercentage={completionPercentage}
            productId={product.id}
            productName={product.name}
            imageCount={productImages.length}
            onOpenPhotosModal={() => setShowPhotosModal(true)}
            onTabChange={setActiveTab}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="publication">
          <ProductPublicationTab
            product={product}
            onProductUpdate={handleProductUpdate}
          />
        </TabContent>
      </div>

      <ProductModals
        product={product}
        showPhotosModal={showPhotosModal}
        showDescriptionsModal={showDescriptionsModal}
        isCategorizeModalOpen={isCategorizeModalOpen}
        onClosePhotos={() => setShowPhotosModal(false)}
        onCloseDescriptions={() => setShowDescriptionsModal(false)}
        onCloseCategorize={() => setIsCategorizeModalOpen(false)}
        onProductUpdate={handleProductUpdate}
        onImagesUpdated={() => {
          // Rafraichir l'instance images du header (thumbnail)
          // Le modal a sa propre instance de useProductImages — il faut synchroniser
          void refreshHeaderImages().catch(err => {
            console.error('[ProductDetail] Header images refresh failed:', err);
          });
        }}
      />
    </div>
  );
}
