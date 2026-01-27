'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

import { useToast } from '@verone/common';
import {
  ProductPhotosModal,
  SourcingProductEditCard,
  useSourcingProducts,
  useProductImages,
} from '@verone/products';
import { Alert, AlertDescription, Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  ArrowLeft,
  CheckCircle,
  Package,
  AlertCircle,
  Building2,
} from 'lucide-react';

export default function SourcingProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const {
    products,
    loading,
    validateSourcing,
    orderSample,
    updateSourcingProduct,
    refetch,
  } = useSourcingProducts();
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);

  const productId = params.id as string;
  const product = products.find(p => p.id === productId);

  // Hook pour les images du produit
  const {
    primaryImage,
    images,
    loading: imagesLoading,
    fetchImages,
  } = useProductImages({
    productId,
    autoFetch: true,
  });

  const handleOrderSample = async () => {
    try {
      await orderSample(productId);
      toast({
        title: 'Échantillon commandé',
        description: "La demande d'échantillon a été enregistrée avec succès",
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: "Impossible de commander l'échantillon",
        variant: 'destructive',
      });
    }
  };

  const handleValidateSourcing = async () => {
    try {
      await validateSourcing(productId);
      toast({
        title: 'Sourcing validé',
        description: 'Le produit a été validé et ajouté au catalogue',
      });
      router.push('/catalogue');
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de valider le sourcing',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Chargement du produit sourcing...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md border-black">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Produit sourcing non trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Ce produit n'existe pas ou n'est plus en mode sourcing.
            </p>
            <ButtonV2
              onClick={() => router.push('/produits/sourcing')}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au sourcing
            </ButtonV2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="ghost"
                onClick={() => router.push('/produits/sourcing')}
                className="text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au sourcing
              </ButtonV2>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-black">
                    Détail Sourcing
                  </h1>
                  {/* Badge Sourcing */}
                  {product.assigned_client ? (
                    <Badge
                      variant="customer"
                      className="flex items-center gap-1"
                    >
                      <Building2 className="h-3 w-3" />
                      Client: {product.assigned_client.name}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Package className="h-3 w-3" />
                      Sourcing interne
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  Validation et gestion du produit en sourcing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8 space-y-6">
        {/* Product Info Card - Éditable inline */}
        <SourcingProductEditCard
          product={product as any}
          primaryImage={primaryImage}
          images={images}
          imagesLoading={imagesLoading}
          onProductUpdate={async updates => {
            try {
              await updateSourcingProduct(productId, updates);
              toast({
                title: 'Produit mis à jour',
                description: 'Les modifications ont été sauvegardées',
              });
              await refetch();
            } catch (_error) {
              toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour le produit',
                variant: 'destructive',
              });
            }
          }}
          onOpenPhotosModal={() => setIsPhotosModalOpen(true)}
        />

        {/* Validation Actions */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="flex items-center text-black">
              <CheckCircle className="h-5 w-5 mr-2" />
              Actions de validation
            </CardTitle>
            <CardDescription>
              Choisissez la prochaine étape selon le workflow de validation
              sourcing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Commander échantillon */}
              <Card className="border-gray-200 h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center mb-3">
                      <Package className="h-6 w-6 text-black mr-2" />
                      <h4 className="font-semibold text-black">
                        Demander un échantillon
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Marquer ce produit comme nécessitant un échantillon et
                      créer une demande de commande.
                    </p>
                  </div>
                  <ButtonV2
                    onClick={() => {
                      void handleOrderSample().catch(error => {
                        console.error(
                          '[SourcingDetail] handleOrderSample failed:',
                          error
                        );
                      });
                    }}
                    disabled={!product.supplier_id}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {product.supplier_id
                      ? 'Commander échantillon'
                      : 'Fournisseur requis'}
                  </ButtonV2>
                </CardContent>
              </Card>

              {/* Valider vers catalogue */}
              <Card className="border-green-200 h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <h4 className="font-semibold text-black">
                        Valider le sourcing
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Valider ce produit sourcing et l'ajouter au catalogue
                      principal.
                    </p>
                  </div>
                  <ButtonV2
                    onClick={() => {
                      void handleValidateSourcing().catch(error => {
                        console.error(
                          '[SourcingDetail] handleValidateSourcing failed:',
                          error
                        );
                      });
                    }}
                    disabled={!product.supplier_id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {product.supplier_id
                      ? 'Valider et ajouter au catalogue'
                      : 'Fournisseur requis'}
                  </ButtonV2>
                </CardContent>
              </Card>
            </div>

            {/* Warning si pas de fournisseur */}
            {!product.supplier_id && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Fournisseur obligatoire :</strong> Vous devez lier un
                  fournisseur à ce produit avant de pouvoir le valider vers le
                  catalogue.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Workflow Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Workflow sourcing :</strong> Les produits en sourcing
            doivent être validés avant d'apparaître dans le catalogue. Si un
            échantillon est requis, utilisez d'abord l'action "Demander un
            échantillon" avant la validation finale.
          </AlertDescription>
        </Alert>
      </div>

      {/* Modal de gestion des photos */}
      {product && (
        <ProductPhotosModal
          isOpen={isPhotosModalOpen}
          onClose={() => setIsPhotosModalOpen(false)}
          productId={productId}
          productName={product.name}
          productType="draft"
          onImagesUpdated={() => {
            void fetchImages().catch(error => {
              console.error('[SourcingDetail] fetchImages failed:', error);
            });
          }}
        />
      )}
    </div>
  );
}
