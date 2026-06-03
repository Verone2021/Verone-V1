'use client';

import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import {
  ArrowLeft,
  CheckCircle,
  Package,
  AlertCircle,
  Building2,
  Search,
  HeartHandshake,
  TestTube,
} from 'lucide-react';

import { SourcingConsultationsSection } from './SourcingConsultationsSection';
import { SourcingProductHeaderActions } from './SourcingProductHeaderActions';

/**
 * Mappe le statut workflow sourcing à l'une des 3 grandes étapes UI.
 * Refonte 2026-05-27 : 7 cards empilées → 3 étapes claires (cf. audit
 * BO-SOURCING-DETAIL-REFONTE-001).
 */
type SourcingStage = 'sourcing' | 'evaluation' | 'sample';

function stageForStatus(status: string): SourcingStage {
  switch (status) {
    case 'need_identified':
    case 'supplier_search':
    case 'initial_contact':
      return 'sourcing';
    case 'evaluation':
    case 'negotiation':
      return 'evaluation';
    case 'sample_requested':
    case 'sample_received':
    case 'sample_approved':
    case 'order_placed':
    case 'received':
      return 'sample';
    default:
      // Statuts spéciaux (on_hold, cancelled, archived) → on reste sur sourcing
      return 'sourcing';
  }
}

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

  // Hook carnet sourcing
  const notebook = useSourcingNotebook(productId);
  const supplierSearch = useSupplierSearch();

  const {
    linkedConsultations,
    loading: consultationsLoading,
    refetch: refetchConsultations,
  } = useProductConsultations(productId);

  const {
    primaryImage,
    images,
    loading: imagesLoading,
    fetchImages,
  } = useProductImages({ productId, autoFetch: true });

  const currentStatus = product?.sourcing_status ?? 'need_identified';

  // Auto-sélection de l'étape selon le statut courant. Si le user change
  // d'onglet manuellement, on respecte son choix (useState d'init seul).
  const initialStage = useMemo(
    () => stageForStatus(currentStatus),
    [currentStatus]
  );
  const [activeStage, setActiveStage] = useState<SourcingStage>(initialStage);

  const handleOrderSample = async () => {
    try {
      const ok = await orderSample(productId);
      if (ok) {
        toast({
          title: 'Échantillon commandé',
          description: 'La commande échantillon a été créée avec succès',
        });
      }
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: "Impossible de commander l'échantillon",
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
        title: 'Produit associé',
        description: 'Le produit a été associé à la consultation',
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
      {/* Header compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="ghost"
                onClick={() => router.push('/produits/sourcing')}
                className="text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </ButtonV2>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-black">
                    {product.name || 'Produit sourcing'}
                  </h1>
                  {product.assigned_client ? (
                    <Badge
                      variant="customer"
                      className="flex items-center gap-1"
                    >
                      <Building2 className="h-3 w-3" />
                      {product.assigned_client.name}
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
              </div>
            </div>
            <SourcingProductHeaderActions productId={productId} />
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-6 space-y-4">
        {/* === Header constant : Pipeline + Guide === */}
        <Card className="border-black">
          <CardContent className="pt-4 pb-3">
            <SourcingPipelineBar
              currentStatus={currentStatus}
              onStatusChange={status => {
                void notebook
                  .updateSourcingPipeline({ sourcing_status: status })
                  .then(() => {
                    setActiveStage(stageForStatus(status));
                    return refetch();
                  })
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

        <SourcingStageGuide currentStatus={currentStatus} />

        {/* === 3 grandes étapes en onglets === */}
        <Tabs
          value={activeStage}
          onValueChange={v => setActiveStage(v as SourcingStage)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="sourcing" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">
                1. Sourcing &amp; contact
              </span>
              <span className="sm:hidden">Sourcing</span>
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4" />
              <span className="hidden sm:inline">
                2. Évaluation &amp; négociation
              </span>
              <span className="sm:hidden">Évaluation</span>
            </TabsTrigger>
            <TabsTrigger value="sample" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">
                3. Échantillon &amp; validation
              </span>
              <span className="sm:hidden">Validation</span>
            </TabsTrigger>
          </TabsList>

          {/* === Étape 1 : Sourcing & contact === */}
          <TabsContent value="sourcing" className="space-y-4">
            <SourcingProductEditCard
              product={
                product as ComponentProps<
                  typeof SourcingProductEditCard
                >['product']
              }
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

            <SourcingUrls
              urls={notebook.urls}
              onAdd={notebook.addUrl}
              onRemove={notebook.removeUrl}
            />

            {/* Consultations liées — visible dès l'étape Sourcing pour donner du contexte client (B5, 2026-06-03) */}
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
          </TabsContent>

          {/* === Étape 2 : Évaluation & négociation === */}
          <TabsContent value="evaluation" className="space-y-4">
            <SourcingCandidateSuppliers
              candidates={notebook.candidates}
              onAdd={notebook.addCandidateSupplier}
              onUpdateStatus={notebook.updateCandidateStatus}
              supplierSearch={supplierSearch}
            />

            <SourcingPriceHistory
              priceHistory={notebook.priceHistory}
              onAdd={notebook.addPriceEntry}
              currentCostPrice={product.cost_price}
              targetPrice={product.target_price}
            />

            <SourcingCommunications
              communications={notebook.communications}
              onAdd={notebook.addCommunication}
              onResolve={notebook.resolveCommunication}
            />
          </TabsContent>

          {/* === Étape 3 : Échantillon & validation === */}
          <TabsContent value="sample" className="space-y-4">
            {/* Actions de validation */}
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="flex items-center text-black">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Actions de validation
                </CardTitle>
                <CardDescription>
                  Commander un échantillon pour validation qualité ou valider
                  directement vers le catalogue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-gray-200 h-full">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center mb-3">
                          <Package className="h-6 w-6 text-black mr-2" />
                          <h4 className="font-semibold text-black">
                            Commander un échantillon
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Crée une commande fournisseur de type{' '}
                          <strong>échantillon</strong> (quantité 1) pour
                          validation qualité avant un éventuel
                          réapprovisionnement.
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

                {!product.supplier_id && (
                  <Alert className="mt-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Fournisseur obligatoire :</strong> Vous devez lier
                      un fournisseur à ce produit avant de pouvoir commander un
                      échantillon ou valider vers le catalogue.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal photos */}
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
