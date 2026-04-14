'use client';

import type { ComponentProps } from 'react';
import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

import { useToast } from '@verone/common';
import { useProductConsultations } from '@verone/consultations/hooks';
import {
  ProductPhotosModal,
  SourcingProductEditCard,
  useSourcingProducts,
  useProductImages,
  SourcingPipelineBar,
  SourcingCommunications,
  SourcingUrls,
  SourcingPriceHistory,
  SourcingCandidateSuppliers,
  SourcingStageGuide,
  getSectionsForStatus,
} from '@verone/products';
import { useSourcingNotebook } from '@verone/products';
import { useSupplierSearch } from '@verone/products';
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

import { SourcingConsultationsSection } from './SourcingConsultationsSection';

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

  // Hook pour le carnet de sourcing
  const notebook = useSourcingNotebook(productId);

  // Hook pour la recherche de fournisseurs candidats
  const supplierSearch = useSupplierSearch();

  // Hook pour les consultations liees au produit
  const {
    linkedConsultations,
    loading: consultationsLoading,
    refetch: refetchConsultations,
  } = useProductConsultations(productId);

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

  // Sections visibles selon le statut courant
  const currentStatus = product?.sourcing_status ?? 'need_identified';
  const visibleSections = getSectionsForStatus(currentStatus);

  const handleOrderSample = async () => {
    try {
      await orderSample(productId);
      toast({
        title: 'Echantillon commande',
        description: "La demande d'echantillon a ete enregistree avec succes",
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: "Impossible de commander l'echantillon",
        variant: 'destructive',
      });
    }
  };

  const handleLinkToConsultation = async (consultationId: string) => {
    try {
      const response = await fetch('/api/consultations/associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultation_id: consultationId,
          product_id: productId,
          quantity: 1,
          proposed_price: null,
          is_free: false,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Erreur lors de l'association");
      }

      toast({
        title: 'Produit associe',
        description: 'Le produit a ete associe a la consultation',
      });
      await refetchConsultations();
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'associer le produit",
        variant: 'destructive',
      });
    }
  };

  const handleValidateSourcing = async () => {
    try {
      await validateSourcing(productId);
      toast({
        title: 'Sourcing valide',
        description: 'Le produit a ete valide et ajoute au catalogue',
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
              Produit sourcing non trouve
            </h3>
            <p className="text-gray-600 mb-4">
              Ce produit n&apos;existe pas ou n&apos;est plus en mode sourcing.
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
                    Detail Sourcing
                  </h1>
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
        {/* Pipeline Status */}
        <Card className="border-black">
          <CardContent className="pt-4 pb-3">
            <SourcingPipelineBar
              currentStatus={currentStatus}
              onStatusChange={status => {
                void notebook
                  .updateSourcingPipeline({ sourcing_status: status })
                  .then(() => refetch())
                  .catch(err => {
                    console.error(
                      '[SourcingDetail] Pipeline update failed:',
                      err
                    );
                  });
              }}
              priority={product.sourcing_priority ?? 'medium'}
              onPriorityChange={priority => {
                void notebook
                  .updateSourcingPipeline({ sourcing_priority: priority })
                  .then(() => refetch())
                  .catch(err => {
                    console.error(
                      '[SourcingDetail] Priority update failed:',
                      err
                    );
                  });
              }}
            />
          </CardContent>
        </Card>

        {/* Guide contextuel de l'etape en cours */}
        <SourcingStageGuide currentStatus={currentStatus} />

        {/* Fiche produit - Editable inline */}
        <SourcingProductEditCard
          product={
            product as ComponentProps<typeof SourcingProductEditCard>['product']
          }
          primaryImage={primaryImage}
          images={images}
          imagesLoading={imagesLoading}
          onProductUpdate={async updates => {
            try {
              await updateSourcingProduct(productId, updates);
              toast({
                title: 'Produit mis a jour',
                description: 'Les modifications ont ete sauvegardees',
              });
              await refetch();
            } catch (_error) {
              toast({
                title: 'Erreur',
                description: 'Impossible de mettre a jour le produit',
                variant: 'destructive',
              });
            }
          }}
          onOpenPhotosModal={() => setIsPhotosModalOpen(true)}
        />

        {/* Fournisseurs candidats — visible a partir de "Recherche fournisseur" */}
        {visibleSections.showCandidates && (
          <SourcingCandidateSuppliers
            candidates={notebook.candidates}
            onAdd={notebook.addCandidateSupplier}
            onUpdateStatus={notebook.updateCandidateStatus}
            supplierSearch={supplierSearch}
          />
        )}

        {/* Actions de validation — visible a partir de "Echantillon demande" */}
        {visibleSections.showValidation && (
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="flex items-center text-black">
                <CheckCircle className="h-5 w-5 mr-2" />
                Actions de validation
              </CardTitle>
              <CardDescription>
                Choisissez la prochaine etape selon le workflow de validation
                sourcing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Commander echantillon */}
                <Card className="border-gray-200 h-full">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center mb-3">
                        <Package className="h-6 w-6 text-black mr-2" />
                        <h4 className="font-semibold text-black">
                          Demander un echantillon
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Marquer ce produit comme necessitant un echantillon et
                        creer une demande de commande.
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
                        ? 'Commander echantillon'
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
                        Valider ce produit sourcing et l&apos;ajouter au
                        catalogue principal.
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
                    <strong>Fournisseur obligatoire :</strong> Vous devez lier
                    un fournisseur a ce produit avant de pouvoir le valider vers
                    le catalogue.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Carnet de sourcing — sections conditionnelles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Colonne gauche : Communications */}
          {visibleSections.showCommunications && (
            <SourcingCommunications
              communications={notebook.communications}
              onAdd={notebook.addCommunication}
              onResolve={notebook.resolveCommunication}
            />
          )}

          {/* Colonne droite : URLs + Historique prix */}
          <div className="space-y-4">
            {visibleSections.showUrls && (
              <SourcingUrls
                urls={notebook.urls}
                onAdd={notebook.addUrl}
                onRemove={notebook.removeUrl}
              />
            )}
            {visibleSections.showPriceHistory && (
              <SourcingPriceHistory
                priceHistory={notebook.priceHistory}
                onAdd={notebook.addPriceEntry}
                currentCostPrice={product.cost_price}
                targetPrice={product.target_price}
              />
            )}
          </div>
        </div>

        {/* Consultations liees */}
        {visibleSections.showConsultations && (
          <SourcingConsultationsSection
            linkedConsultations={linkedConsultations}
            consultationsLoading={consultationsLoading}
            assignedClientId={product.assigned_client_id}
            productId={productId}
            onLinkToConsultation={consultationId => {
              void handleLinkToConsultation(consultationId).catch(error => {
                console.error(
                  '[SourcingDetail] Link consultation failed:',
                  error
                );
              });
            }}
          />
        )}
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
