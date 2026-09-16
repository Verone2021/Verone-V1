'use client';

import type { ComponentProps } from 'react';

import { useParams } from 'next/navigation';

import {
  ProductEvaluationDialog,
  ProductEvaluationSummary,
  ProductPhotosModal,
  RfqTemplateDialog,
  SampleOrderCard,
  SampleOrderPickerDialog,
  SourcingActionBar,
  SourcingCompletenessCard,
  SourcingJournal,
  SourcingOffersSection,
  SourcingPhotos,
  SourcingProductEditCard,
  SourcingStageHeader,
  SourcingStagePanel,
  SourcingUrls,
} from '@verone/products';
import { availableLifecycleActions } from '@verone/products/utils';
import { Badge, ButtonV2, Card, CardContent } from '@verone/ui';
import { ArrowLeft, Building2, Package } from 'lucide-react';

import { SourcingConsultationsSection } from './SourcingConsultationsSection';
import { SourcingLifecycleDialogs } from './SourcingLifecycleDialogs';
import { SourcingProductHeaderActions } from './SourcingProductHeaderActions';
import {
  SourcingProductLoading,
  SourcingProductNotFound,
} from './SourcingProductStates';
import { useSourcingDetailPage } from './use-sourcing-detail-page';

export default function SourcingProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const {
    router,
    toast,
    product,
    loading,
    refetch,
    draftOrder,
    notebook,
    sample,
    sampleCandidates,
    evaluation,
    linkedConsultations,
    consultationsLoading,
    primaryImage,
    images,
    imagesLoading,
    fetchImages,
    bulkSample,
    adoptOffer,
    pricing,
    currentStatus,
    isWithdrawn,
    busy,
    draftOrderForProduct,
    showCompleteness,
    currentStage,
    stageProgress,
    isPhotosModalOpen,
    setIsPhotosModalOpen,
    isEvaluationDialogOpen,
    setIsEvaluationDialogOpen,
    journalMode,
    setJournalMode,
    reasonAction,
    setReasonAction,
    confirmValidateOpen,
    setConfirmValidateOpen,
    openSections,
    setOpenSections,
    isSamplePickerOpen,
    setIsSamplePickerOpen,
    rfqMode,
    setRfqMode,
    journalRef,
    handleGoToField,
    runAction,
    handleLifecycle,
    handleOrderSample,
    handleAddNote,
    handlePriorityChange,
    handleLinkToConsultation,
    handleStageAction,
  } = useSourcingDetailPage(productId);

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
              progress={stageProgress}
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

        <SourcingStagePanel
          stage={currentStage}
          progress={stageProgress}
          busy={busy}
          unavailableActions={
            sample.state !== 'none' && sample.state !== 'cancelled'
              ? { order_sample: 'Un échantillon est déjà en cours.' }
              : {}
          }
          onAction={handleStageAction}
        />

        {draftOrderForProduct !== null && product.supplier_id !== null && (
          <SampleOrderCard
            order={draftOrderForProduct}
            currentProductId={productId}
            candidateCount={sampleCandidates.data?.length ?? 0}
            busy={busy || bulkSample.running}
            onAddProducts={() => setIsSamplePickerOpen(true)}
            onOpenOrder={orderId =>
              router.push(`/commandes/fournisseurs?id=${orderId}`)
            }
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
          <div id="sourcing-links" className="scroll-mt-4">
            <SourcingUrls
              urls={notebook.urls}
              onAdd={notebook.addUrl}
              onRemove={notebook.removeUrl}
            />
          </div>
        </section>

        <div id="sourcing-offers" className="scroll-mt-4">
          <SourcingOffersSection
            product={{
              supplier_id: product.supplier_id,
              cost_price: product.cost_price,
              target_price: product.target_price ?? null,
              eco_tax_default: product.eco_tax_default ?? null,
            }}
            offers={notebook.candidates}
            priceHistory={notebook.priceHistory}
            busy={busy || adoptOffer.adoptingId !== null}
            onAddOffer={notebook.addCandidateSupplier}
            onUpdateOffer={notebook.updateCandidateOffer}
            onUpdateStatus={(offerId, status) => {
              void notebook
                .updateCandidateStatus(offerId, status)
                .catch(error => {
                  console.error('[SourcingDetail] statut offre:', error);
                });
            }}
            onUpdateStatuses={(offerIds, status) => {
              void notebook
                .updateCandidateStatuses(offerIds, status)
                .catch(error => {
                  console.error('[SourcingDetail] statuts offres:', error);
                });
            }}
            onAdoptOffer={offerId => {
              void adoptOffer.adoptOffer(offerId).catch(error => {
                console.error('[SourcingDetail] adoption offre:', error);
              });
            }}
            adoptingOfferId={adoptOffer.adoptingId}
            onAddPrice={notebook.addPriceEntry}
            onSaveTargetPrice={pricing.updateTargetPrice}
            savingTargetPrice={pricing.savingTargetPrice}
            onAdoptPrice={entry => {
              void pricing.adoptCostPrice(entry).catch(error => {
                console.error('[SourcingDetail] adoption prix:', error);
              });
            }}
            adoptingPriceId={pricing.adoptingPriceId}
          />
        </div>

        <SourcingPhotos photos={notebook.photos} />

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

      <SampleOrderPickerDialog
        open={isSamplePickerOpen}
        onOpenChange={setIsSamplePickerOpen}
        supplierName={product.supplier?.name ?? 'ce fournisseur'}
        candidates={sampleCandidates.data ?? []}
        loading={sampleCandidates.isLoading}
        busy={bulkSample.running}
        poNumber={draftOrder?.poNumber}
        onConfirm={async productIds => {
          await bulkSample.orderSamples(productIds);
          await sampleCandidates.refetch();
        }}
      />

      <RfqTemplateDialog
        key={rfqMode ?? 'closed'}
        open={rfqMode !== null}
        onOpenChange={open => {
          if (!open) setRfqMode(null);
        }}
        mode={rfqMode ?? 'request'}
        productName={product.name}
        supplierReference={product.supplier_reference ?? null}
        targetPrice={product.target_price ?? null}
        defaultQuantity={product.supplier_moq ?? null}
        supplierId={product.supplier_id}
        saving={busy}
        onLogExchange={notebook.addCommunication}
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
