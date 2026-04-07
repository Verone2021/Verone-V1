'use client';

/**
 * Modal Édition Produit Site Internet
 * 5 onglets : Général / SEO / Tarification / Images / Variantes
 * 32 champs éditables sur 4 tables
 */

import { useQueryClient } from '@tanstack/react-query';
import { ProductPhotosModal, ProductImageViewerModal } from '@verone/products';
import { ProductThumbnail } from '@verone/products';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Info, Search, Euro, Image as ImageIcon, Package } from 'lucide-react';

import { EditSiteInternetProductModalFooter } from './EditSiteInternetProductModalFooter';
import { TabGeneral } from './TabGeneral';
import { TabImages } from './TabImages';
import { TabInformations } from './TabInformations';
import { TabPricing } from './TabPricing';
import { TabSEO } from './TabSEO';
import { TabVariantes } from './TabVariantes';
import type { EditSiteInternetProductModalProps } from './types';
import { useEditSiteInternetProduct } from './useEditSiteInternetProduct';

export function EditSiteInternetProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: EditSiteInternetProductModalProps) {
  const queryClient = useQueryClient();
  const {
    formData,
    setFormData,
    errors,
    activeTab,
    setActiveTab,
    showPhotosModal,
    setShowPhotosModal,
    showImageViewer,
    setShowImageViewer,
    selectedImageIndex,
    catalogueImages,
    imagesLoading,
    fetchImages,
    setPrimaryImage,
    deleteImage,
    productImages,
    updateProduct,
    handleSubmit,
    getError,
  } = useEditSiteInternetProduct(product, onClose, onSuccess);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <ProductThumbnail
                src={product.primary_image_url}
                alt={product.name}
                size="sm"
              />
              <div>
                <div className="font-semibold">{product.name}</div>
                <div className="text-sm text-gray-500 font-normal">
                  SKU: {product.sku}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger
                  value="general"
                  className="flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  Général
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  SEO
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="flex items-center gap-2"
                >
                  <Euro className="h-4 w-4" />
                  Tarification
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger
                  value="variants"
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Variantes
                  {product.has_variants && (
                    <Badge variant="outline" className="ml-1">
                      {product.variants_count}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="informations"
                  className="flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  Informations
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto py-6">
                <TabsContent value="general" className="space-y-6">
                  <TabGeneral
                    product={product}
                    formData={formData}
                    setFormData={setFormData}
                    getError={getError}
                  />
                </TabsContent>

                <TabsContent value="seo" className="space-y-6">
                  <TabSEO
                    product={product}
                    formData={formData}
                    setFormData={setFormData}
                    getError={getError}
                  />
                </TabsContent>

                <TabsContent value="pricing" className="space-y-6">
                  <TabPricing
                    product={product}
                    formData={formData}
                    setFormData={setFormData}
                    getError={getError}
                  />
                </TabsContent>

                <TabsContent value="images" className="space-y-6">
                  <TabImages
                    catalogueImages={catalogueImages}
                    imagesLoading={imagesLoading}
                    fetchImages={fetchImages}
                    setPrimaryImage={setPrimaryImage}
                    deleteImage={deleteImage}
                    onAddImages={() => setShowPhotosModal(true)}
                  />
                </TabsContent>

                <TabsContent value="variants" className="space-y-6">
                  <TabVariantes product={product} />
                </TabsContent>

                <TabsContent value="informations" className="space-y-6">
                  <TabInformations
                    product={product}
                    formData={formData}
                    setFormData={setFormData}
                    getError={getError}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <EditSiteInternetProductModalFooter
              errors={errors}
              isPending={updateProduct.isPending}
              onClose={onClose}
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Photos (réutilisation composant existant) - HORS Dialog parent */}
      {showPhotosModal && (
        <ProductPhotosModal
          isOpen={showPhotosModal}
          onClose={() => setShowPhotosModal(false)}
          productId={product.product_id}
          productName={product.name}
          productType="product"
          onImagesUpdated={() => {
            void queryClient
              .invalidateQueries({
                queryKey: ['site-internet-products'],
              })
              .catch(error => {
                console.error(
                  '[EditSiteInternetProductModal] invalidateQueries failed:',
                  error
                );
              });
          }}
        />
      )}

      {/* Modal Visualiseur Images - HORS Dialog parent */}
      {showImageViewer && productImages.length > 0 && (
        <ProductImageViewerModal
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={productImages}
          initialImageIndex={selectedImageIndex}
          productName={product.name}
        />
      )}
    </>
  );
}
