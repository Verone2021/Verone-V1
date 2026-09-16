'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { useProductConsultations } from '@verone/consultations/hooks';
import {
  useAdoptOffer,
  useBulkSampleOrder,
  useProductEvaluation,
  useProductImages,
  useSampleCandidates,
  useSampleDraftOrder,
  useSampleState,
  useSourcingLifecycle,
  useSourcingNotebook,
  useSourcingPricing,
  useSourcingProducts,
  type SourcingBarLifecycleAction,
  type SourcingJournalFormMode,
  type SourcingLifecycleInput,
} from '@verone/products';
import {
  availableLifecycleActions,
  isOverdueFollowUp,
  stageOfStatus,
  type SourcingFieldSection,
  type SourcingStageActionKey,
  type SourcingStageProgressInput,
} from '@verone/products/utils';
import { associateProductToConsultation } from '@verone/utils';

import type { SourcingReasonAction } from './SourcingLifecycleDialogs';

/**
 * Tout l'état et les gestes de la fiche sourcing — [BO-SOURCING-ETAPES-003]
 *
 * Sorti de `page.tsx` : la fiche dépassait les 400 lignes imposées par les
 * standards du dépôt. Le composant ne garde que l'affichage, ce hook porte les
 * chargements, les états d'écran et les enchaînements d'actions.
 */
export function useSourcingDetailPage(productId: string) {
  const router = useRouter();
  const { toast } = useToast();

  // Chargement par identifiant : la fiche d'un produit retiré reste lisible.
  const { products, loading, orderSample, refetch } = useSourcingProducts({
    product_id: productId,
  });
  const product = products.find(p => p.id === productId);

  const notebook = useSourcingNotebook(productId);
  const sample = useSampleState(productId);
  const sampleDraft = useSampleDraftOrder(product?.supplier_id);
  const sampleCandidates = useSampleCandidates(product?.supplier_id, productId);
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
  const [isSamplePickerOpen, setIsSamplePickerOpen] = useState(false);

  const bulkSample = useBulkSampleOrder(async () => {
    await Promise.all([refetch(), sampleDraft.refetch(), sample.refetch()]);
  });

  const adoptOffer = useAdoptOffer(productId, async () => {
    await Promise.all([refetch(), notebook.refetch()]);
  });

  const pricing = useSourcingPricing(
    productId,
    notebook.addCommunication,
    async () => {
      await refetch();
    }
  );

  const [rfqMode, setRfqMode] = useState<'request' | 'counter_offer' | null>(
    null
  );
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
      await Promise.all([
        sampleDraft.refetch(),
        sampleCandidates.refetch(),
        sample.refetch(),
      ]);
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
  // `product` est absent tant que le chargement n'a pas abouti : les valeurs
  // dérivées restent calculables, c'est la page qui décide quoi afficher.
  const currentStatus = product?.sourcing_status;
  const isWithdrawn = Boolean(product?.archived_at);
  const busy = lifecycle.pendingAction !== null || orderingSample;
  // Commande d'échantillons brouillon du fournisseur, quand elle contient
  // bien ce produit : c'est elle qui accueille les échantillons suivants.
  const draftOrder = sampleDraft.data ?? null;
  const draftOrderForProduct = draftOrder?.lines.some(
    line => line.productId === productId
  )
    ? draftOrder
    : null;
  // La checklist n'a de sens que tant que le produit peut encore être validé.
  const showCompleteness = availableLifecycleActions(
    currentStatus,
    isWithdrawn
  ).includes('validate');

  const { stage: currentStage } = stageOfStatus(currentStatus);
  const stageProgress: SourcingStageProgressInput = {
    linkCount: notebook.urls.length,
    photoCount: notebook.photos.length,
    offerStatuses: notebook.candidates.map(candidate => candidate.status),
    exchangeCount: notebook.communications.filter(
      entry => entry.entry_type === 'exchange'
    ).length,
    overdueFollowUps: notebook.communications.filter(entry =>
      isOverdueFollowUp(entry)
    ).length,
    priceEntryCount: notebook.priceHistory.length,
    hasSample: sample.state !== 'none' && sample.state !== 'cancelled',
    hasEvaluation: Boolean(evaluation.evaluation),
  };

  /** Chaque action du panneau d'étape mène à ce qui existe déjà sur la fiche. */
  const handleStageAction = (action: SourcingStageActionKey) => {
    switch (action) {
      case 'add_link':
      case 'add_offer':
      case 'set_target_price':
      case 'mark_contacted':
      case 'add_price':
        // Ces actions vivent dans leurs sections : on y amène l'utilisateur.
        document
          .getElementById(
            action === 'add_link' ? 'sourcing-links' : 'sourcing-offers'
          )
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      case 'rfq_template':
        setRfqMode(
          currentStage === 'negotiation' ? 'counter_offer' : 'request'
        );
        return;
      case 'plan_follow_up':
      case 'add_note':
        handleAddNote();
        return;
      case 'order_sample':
        void handleOrderSample().catch(error => {
          console.error('[SourcingDetail] order sample failed:', error);
        });
        return;
      case 'evaluate_sample':
        setIsEvaluationDialogOpen(true);
        return;
      default:
        return;
    }
  };

  return {
    router,
    toast,
    product,
    loading,
    refetch,
    draftOrder,
    currentStatus,
    isWithdrawn,
    busy,
    draftOrderForProduct,
    showCompleteness,
    currentStage,
    stageProgress,
    notebook,
    sample,
    sampleCandidates,
    lifecycle,
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
    // États d'écran
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
    // Gestes
    handleGoToField,
    runAction,
    handleLifecycle,
    handleOrderSample,
    handleAddNote,
    handlePriorityChange,
    handleLinkToConsultation,
    handleStageAction,
  };
}
