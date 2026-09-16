'use client';

import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { useProductConsultations } from '@verone/consultations/hooks';
import {
  ProductEvaluationDialog,
  ProductEvaluationSummary,
  ProductPhotosModal,
  SourcingActionBar,
  SourcingCompletenessCard,
  SourcingJournal,
  SourcingOffersSection,
  SourcingProductEditCard,
  SourcingStageHeader,
  SourcingUrls,
  useProductEvaluation,
  useProductImages,
  useSampleState,
  useSourcingLifecycle,
  useSourcingNotebook,
  useSourcingProducts,
  useSupplierSearch,
  type SourcingBarLifecycleAction,
  type SourcingJournalFormMode,
  type SourcingLifecycleInput,
} from '@verone/products';
import {
  availableLifecycleActions,
  type SourcingFieldSection,
} from '@verone/products/utils';
import { Badge, ButtonV2, Card, CardContent } from '@verone/ui';
import { associateProductToConsultation } from '@verone/utils';
import { ArrowLeft, Building2, Package } from 'lucide-react';

import { SourcingConsultationsSection } from './SourcingConsultationsSection';
import {
  SourcingLifecycleDialogs,
  type SourcingReasonAction,
} from './SourcingLifecycleDialogs';
import { SourcingProductHeaderActions } from './SourcingProductHeaderActions';
import {
  SourcingProductLoading,
  SourcingProductNotFound,
} from './SourcingProductStates';

export default function SourcingProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { toast } = useToast();

  // Chargement par identifiant : la fiche d'un produit retiré reste lisible.
  const { products, loading, orderSample, refetch } = useSourcingProducts({
    product_id: productId,
  });
  const product = products.find(p => p.id === productId);

  const notebook = useSourcingNotebook(productId);
  const supplierSearch = useSupplierSearch();
  const sample = useSampleState(productId);
  const lifecycle = useSourcingLifecycle(productId);
  const evaluation = useProductEvaluation(productId, notebook.addCommunication);
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

  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [journalMode, setJournalMode] =
    useState<SourcingJournalFormMode | null>(null);
  const [reasonAction, setReasonAction] = useState<SourcingReasonAction | null>(
    null
  );
  const [confirmValidateOpen, setConfirmValidateOpen] = useState(false);
  const [orderingSample, setOrderingSample] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['pricing']);
  const journalRef = useRef<HTMLDivElement>(null);

  /**
   * Amène l'utilisateur au champ manquant signalé par la checklist : ouvre la
   * bonne section de la fiche puis fait défiler jusqu'à elle.
   */
  const handleGoToField = (section: SourcingFieldSection) => {
    if (section === 'photos') {
      setIsPhotosModalOpen(true);
      return;
    }
    if (
      section === 'pricing' ||
      section === 'supplier' ||
      section === 'details'
    ) {
      setOpenSections(previous =>
        previous.includes(section) ? previous : [...previous, section]
      );
    }
    const target = `sourcing-section-${section}`;
    requestAnimationFrame(() => {
      document
        .getElementById(target)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const runAction = async (input: SourcingLifecycleInput): Promise<boolean> => {
    const ok = await lifecycle.applyAction(input);
    if (!ok) return false;
    if (input.action === 'validate') {
      // Le produit a quitté le sourcing : sa fiche est désormais au catalogue
      router.push(`/produits/catalogue/${productId}`);
      return true;
    }
    await Promise.all([refetch(), notebook.refetch()]);
    return true;
  };

  const handleLifecycle = (action: SourcingBarLifecycleAction) => {
    if (action === 'refuse' || action === 'withdraw') {
      setReasonAction(action);
      return;
    }
    if (action === 'validate') {
      setConfirmValidateOpen(true);
      return;
    }
    void runAction({ action }).catch(error => {
      console.error('[SourcingDetail] lifecycle failed:', error);
    });
  };

  const handleOrderSample = async () => {
    setOrderingSample(true);
    try {
      await orderSample(productId);
    } finally {
      setOrderingSample(false);
    }
  };

  const handleAddNote = () => {
    setJournalMode('note');
    journalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePriorityChange = async (priority: string) => {
    try {
      await notebook.updatePriority(priority);
      await refetch();
    } catch (error) {
      console.error('[SourcingDetail] priority update failed:', error);
      toast({
        title: 'Erreur',
        description: "La priorité n'a pas pu être enregistrée",
        variant: 'destructive',
      });
    }
  };

  const handleLinkToConsultation = async (consultationId: string) => {
    try {
      await associateProductToConsultation({
        consultationId,
        productId,
        quantity: 1,
        proposedPrice: null,
        isFree: false,
      });
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

  if (loading) {
    return <SourcingProductLoading />;
  }

  if (!product) {
    return (
      <SourcingProductNotFound
        onBack={() => router.push('/produits/sourcing')}
      />
    );
  }

  const currentStatus = product.sourcing_status;
  const isWithdrawn = Boolean(product.archived_at);
  const busy = lifecycle.pendingAction !== null || orderingSample;
  // La checklist n'a de sens que tant que le produit peut encore être validé.
  const showCompleteness = availableLifecycleActions(
    currentStatus,
    isWithdrawn
  ).includes('validate');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <ButtonV2
              variant="ghost"
              onClick={() => router.push('/produits/sourcing')}
              className="text-gray-600 hover:text-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </ButtonV2>
            <h1
              className="min-w-0 truncate text-xl font-bold text-black md:text-2xl"
              title={product.name}
            >
              {product.name || 'Produit sourcing'}
            </h1>
            {product.assigned_client ? (
              <Badge variant="customer" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {product.assigned_client.name}
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Sourcing interne
              </Badge>
            )}
          </div>
          <SourcingProductHeaderActions productId={productId} />
        </div>
      </div>

      <div className="w-full space-y-6 px-4 py-6">
        <Card className="border-black">
          <CardContent className="space-y-4 pt-4">
            <SourcingStageHeader
              status={currentStatus}
              isWithdrawn={isWithdrawn}
              sample={sample}
              sampleLoading={sample.loading}
              priority={product.sourcing_priority ?? 'medium'}
              canChangeStage={
                !busy &&
                availableLifecycleActions(currentStatus, isWithdrawn).includes(
                  'set_stage'
                )
              }
              onStageSelect={toStage => {
                void runAction({ action: 'set_stage', toStage }).catch(
                  error => {
                    console.error(
                      '[SourcingDetail] stage change failed:',
                      error
                    );
                  }
                );
              }}
              onPriorityChange={priority => {
                void handlePriorityChange(priority);
              }}
            />
            <SourcingActionBar
              status={currentStatus}
              isWithdrawn={isWithdrawn}
              product={product}
              sample={sample}
              busy={busy}
              hasEvaluation={Boolean(evaluation.evaluation)}
              onAddNote={handleAddNote}
              onOrderSample={() => {
                void handleOrderSample().catch(error => {
                  console.error('[SourcingDetail] order sample failed:', error);
                });
              }}
              onViewOrder={orderId =>
                router.push(`/commandes/fournisseurs?id=${orderId}`)
              }
              onLifecycle={handleLifecycle}
              onEvaluateSample={() => setIsEvaluationDialogOpen(true)}
            />
          </CardContent>
        </Card>

        {showCompleteness && (
          <SourcingCompletenessCard
            product={product}
            onGoToField={handleGoToField}
          />
        )}

        <ProductEvaluationSummary
          evaluation={evaluation.evaluation}
          sampleState={sample.state}
          onEvaluate={() => setIsEvaluationDialogOpen(true)}
        />

        <section aria-label="Fiche produit" className="space-y-4">
          <SourcingProductEditCard
            product={
              product as ComponentProps<
                typeof SourcingProductEditCard
              >['product']
            }
            primaryImage={primaryImage}
            images={images}
            imagesLoading={imagesLoading}
            openSections={openSections}
            onOpenSectionsChange={setOpenSections}
            onProductUpdate={async () => {
              // La carte a déjà écrit en base (useInlineEdit) : ici on se
              // contente de recharger, sans seconde écriture.
              await refetch();
              toast({
                title: 'Produit mis à jour',
                description: 'Les modifications ont été sauvegardées',
              });
            }}
            onOpenPhotosModal={() => setIsPhotosModalOpen(true)}
          />
          <SourcingUrls
            urls={notebook.urls}
            onAdd={notebook.addUrl}
            onRemove={notebook.removeUrl}
          />
        </section>

        <SourcingOffersSection
          candidates={{
            candidates: notebook.candidates,
            onAdd: notebook.addCandidateSupplier,
            onUpdateStatus: notebook.updateCandidateStatus,
            supplierSearch,
          }}
          prices={{
            priceHistory: notebook.priceHistory,
            onAdd: notebook.addPriceEntry,
            currentCostPrice: product.cost_price,
            targetPrice: product.target_price,
          }}
        />

        <div ref={journalRef} className="scroll-mt-4">
          <SourcingJournal
            entries={notebook.communications}
            formMode={journalMode}
            onFormModeChange={setJournalMode}
            onAdd={notebook.addCommunication}
            onResolve={notebook.resolveCommunication}
          />
        </div>

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
      </div>

      <SourcingLifecycleDialogs
        reasonAction={reasonAction}
        onReasonClose={() => setReasonAction(null)}
        onReasonConfirm={(action, reason) => runAction({ action, reason })}
        validateOpen={confirmValidateOpen}
        onValidateOpenChange={setConfirmValidateOpen}
        onValidateConfirm={async () => {
          await runAction({ action: 'validate' });
        }}
      />

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

      <ProductEvaluationDialog
        open={isEvaluationDialogOpen}
        onOpenChange={setIsEvaluationDialogOpen}
        evaluation={evaluation.evaluation}
        saving={evaluation.saving}
        onSave={evaluation.saveEvaluation}
        supplierId={product.supplier_id}
        purchaseOrderItemId={sample.itemId}
      />
    </div>
  );
}
