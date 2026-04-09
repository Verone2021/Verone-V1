'use client';

import { TabsNavigation, TabContent } from '@verone/ui';

import { ProductDetailHeader } from './_components/product-detail-header';
import { ProductDescriptionsTab } from './_components/product-descriptions-tab';
import { ProductCharacteristicsTab } from './_components/product-characteristics-tab';
import { ProductGeneralTab } from './_components/product-general-tab';
import { ProductImagesTab } from './_components/product-images-tab';
import { ProductLoadingState } from './_components/ProductLoadingState';
import { ProductModals } from './_components/ProductModals';
import { ProductPricingTab } from './_components/product-pricing-tab';
import { ProductStockTab } from './_components/product-stock-tab';
import { useProductDetail } from './_components/hooks/use-product-detail';

export default function ProductDetailPage() {
  const {
    product,
    loading,
    error,
    activeTab,
    setActiveTab,
    showPhotosModal,
    setShowPhotosModal,
    showCharacteristicsModal,
    setShowCharacteristicsModal,
    showDescriptionsModal,
    setShowDescriptionsModal,
    isCategorizeModalOpen,
    setIsCategorizeModalOpen,
    channelPricing,
    productImages,
    _primaryImage,
    breadcrumbParts,
    missingFields,
    completionPercentage,
    sourcing,
    primaryImageUrl,
    tabs,
    handleProductUpdate,
    handleShare,
    router,
  } = useProductDetail();

  if (loading || (!product && !error)) {
    return (
      <ProductLoadingState
        loading={loading}
        error={null}
        onBack={() => router.push('/produits/catalogue')}
      />
    );
  }

  if (error || !product) {
    return (
      <ProductLoadingState
        loading={false}
        error={error}
        onBack={() => router.push('/produits/catalogue')}
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
        onBack={() => router.push('/produits/catalogue')}
        onShare={handleShare}
        onImageClick={() => setShowPhotosModal(true)}
      />

      <div className="max-w-[1800px] mx-auto px-4">
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
            missingFields={missingFields}
            sourcing={sourcing}
            breadcrumbParts={breadcrumbParts}
            onProductUpdate={handleProductUpdate}
            onOpenCategorizeModal={() => setIsCategorizeModalOpen(true)}
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
            channelPricing={channelPricing}
            onProductUpdate={handleProductUpdate}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="stock">
          <ProductStockTab
            product={product}
            onProductUpdate={handleProductUpdate}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="characteristics">
          <ProductCharacteristicsTab
            product={product}
            onOpenCharacteristicsModal={() => setShowCharacteristicsModal(true)}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="images">
          <ProductImagesTab
            productId={product.id}
            productName={product.name}
            imageCount={productImages.length}
            onOpenPhotosModal={() => setShowPhotosModal(true)}
          />
        </TabContent>
      </div>

      <ProductModals
        product={product}
        showPhotosModal={showPhotosModal}
        showCharacteristicsModal={showCharacteristicsModal}
        showDescriptionsModal={showDescriptionsModal}
        isCategorizeModalOpen={isCategorizeModalOpen}
        onClosePhotos={() => setShowPhotosModal(false)}
        onCloseCharacteristics={() => setShowCharacteristicsModal(false)}
        onCloseDescriptions={() => setShowDescriptionsModal(false)}
        onCloseCategorize={() => setIsCategorizeModalOpen(false)}
        onProductUpdate={handleProductUpdate}
        onImagesUpdated={() => {
          // useProductImages gere son propre refresh via fetchImages()
          // Pas besoin de recharger tout le produit pour les images
        }}
      />
    </div>
  );
}
