'use client';

import { TabsNavigation, TabContent } from '@verone/ui';

import { ProductDetailHeader } from './_components/product-detail-header';
import { ProductDescriptionsTab } from './_components/product-descriptions-tab';
import { ProductCharacteristicsTab } from './_components/product-characteristics-tab';
import { ProductGeneralTab } from './_components/product-general-tab';
import { ProductImagesTab } from './_components/product-images-tab';
import { ProductPublicationTab } from './_components/product-publication-tab';
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

        <TabContent activeTab={activeTab} tabId="publication">
          <ProductPublicationTab product={product} />
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
