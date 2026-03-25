'use client';

import { useState } from 'react';

import {
  useAllAffiliateProducts,
  useApproveProduct,
  useRejectProduct,
  useUpdateAffiliateProduct,
  type PendingProduct,
  type AffiliateProductApprovalStatus,
  type CommissionRate,
} from '../../hooks/use-product-approvals';

export type ProduitsTabState = {
  selectedStatus: AffiliateProductApprovalStatus | 'all';
  setSelectedStatus: (v: AffiliateProductApprovalStatus | 'all') => void;
  selectedProduct: PendingProduct | null;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  isRejectDialogOpen: boolean;
  setIsRejectDialogOpen: (v: boolean) => void;
  isDetailOpen: boolean;
  setIsDetailOpen: (v: boolean) => void;
  isApproveDialogOpen: boolean;
  setIsApproveDialogOpen: (v: boolean) => void;
  selectedCommission: CommissionRate;
  setSelectedCommission: (v: CommissionRate) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (v: boolean) => void;
  editCommissionRate: number;
  setEditCommissionRate: (v: number) => void;
  editPayoutHt: number;
  setEditPayoutHt: (v: number) => void;
  editChangeReason: string;
  setEditChangeReason: (v: string) => void;
  products: PendingProduct[] | undefined;
  isLoading: boolean;
  approveProduct: ReturnType<typeof useApproveProduct>;
  rejectProduct: ReturnType<typeof useRejectProduct>;
  updateProduct: ReturnType<typeof useUpdateAffiliateProduct>;
  handleApproveClick: (product: PendingProduct) => void;
  handleApproveConfirm: () => Promise<void>;
  handleRejectClick: (product: PendingProduct) => void;
  handleRejectConfirm: () => Promise<void>;
  handleViewDetails: (product: PendingProduct) => void;
  handleEditClick: (product: PendingProduct) => void;
  handleEditConfirm: () => Promise<void>;
};

type Setters = {
  setSelectedProduct: (p: PendingProduct | null) => void;
  setIsApproveDialogOpen: (v: boolean) => void;
  setIsRejectDialogOpen: (v: boolean) => void;
  setIsDetailOpen: (v: boolean) => void;
  setIsEditDialogOpen: (v: boolean) => void;
  setSelectedCommission: (v: CommissionRate) => void;
  setRejectReason: (v: string) => void;
  setEditCommissionRate: (v: number) => void;
  setEditPayoutHt: (v: number) => void;
  setEditChangeReason: (v: string) => void;
};

function makeApproveHandlers(
  selectedProduct: PendingProduct | null,
  selectedCommission: CommissionRate,
  approveProduct: ReturnType<typeof useApproveProduct>,
  refetch: () => Promise<unknown>,
  setters: Pick<
    Setters,
    'setSelectedProduct' | 'setIsApproveDialogOpen' | 'setSelectedCommission'
  >
) {
  const handleApproveClick = (product: PendingProduct) => {
    setters.setSelectedProduct(product);
    setters.setSelectedCommission(5);
    setters.setIsApproveDialogOpen(true);
  };
  const handleApproveConfirm = async () => {
    if (!selectedProduct) return;
    try {
      await approveProduct.mutateAsync({
        productId: selectedProduct.id,
        commissionRate: selectedCommission,
      });
      setters.setIsApproveDialogOpen(false);
      setters.setSelectedProduct(null);
      void refetch().catch(e =>
        console.error('[Approbations] Refetch failed:', e)
      );
    } catch {
      alert("Erreur lors de l'approbation");
    }
  };
  return { handleApproveClick, handleApproveConfirm };
}

function makeRejectHandlers(
  selectedProduct: PendingProduct | null,
  rejectReason: string,
  rejectProduct: ReturnType<typeof useRejectProduct>,
  refetch: () => Promise<unknown>,
  setters: Pick<
    Setters,
    'setSelectedProduct' | 'setIsRejectDialogOpen' | 'setRejectReason'
  >
) {
  const handleRejectClick = (product: PendingProduct) => {
    setters.setSelectedProduct(product);
    setters.setRejectReason('');
    setters.setIsRejectDialogOpen(true);
  };
  const handleRejectConfirm = async () => {
    if (!selectedProduct || !rejectReason.trim()) return;
    try {
      await rejectProduct.mutateAsync({
        productId: selectedProduct.id,
        reason: rejectReason.trim(),
      });
      setters.setIsRejectDialogOpen(false);
      setters.setSelectedProduct(null);
      void refetch().catch(e =>
        console.error('[Approbations] Refetch failed:', e)
      );
    } catch {
      alert('Erreur lors du rejet');
    }
  };
  return { handleRejectClick, handleRejectConfirm };
}

function makeEditHandlers(
  selectedProduct: PendingProduct | null,
  editCommissionRate: number,
  editPayoutHt: number,
  editChangeReason: string,
  updateProduct: ReturnType<typeof useUpdateAffiliateProduct>,
  refetch: () => Promise<unknown>,
  setters: Pick<
    Setters,
    | 'setSelectedProduct'
    | 'setIsEditDialogOpen'
    | 'setEditCommissionRate'
    | 'setEditPayoutHt'
    | 'setEditChangeReason'
  >
) {
  const handleEditClick = (product: PendingProduct) => {
    setters.setSelectedProduct(product);
    setters.setEditCommissionRate(product.affiliate_commission_rate ?? 0);
    setters.setEditPayoutHt(product.affiliate_payout_ht ?? 0);
    setters.setEditChangeReason('');
    setters.setIsEditDialogOpen(true);
  };
  const handleEditConfirm = async () => {
    if (!selectedProduct) return;
    try {
      await updateProduct.mutateAsync({
        productId: selectedProduct.id,
        commissionRate: editCommissionRate,
        payoutHt: editPayoutHt,
        changeReason: editChangeReason ?? undefined,
      });
      setters.setIsEditDialogOpen(false);
      setters.setSelectedProduct(null);
      void refetch().catch(e =>
        console.error('[Approbations] Refetch failed:', e)
      );
    } catch (err) {
      alert(
        'Erreur lors de la modification: ' +
          (err instanceof Error ? err.message : 'Erreur inconnue')
      );
    }
  };
  return { handleEditClick, handleEditConfirm };
}

function useProduitsTabDialogState() {
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] =
    useState<CommissionRate>(5);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCommissionRate, setEditCommissionRate] = useState<number>(0);
  const [editPayoutHt, setEditPayoutHt] = useState<number>(0);
  const [editChangeReason, setEditChangeReason] = useState('');
  return {
    selectedProduct,
    setSelectedProduct,
    rejectReason,
    setRejectReason,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    isDetailOpen,
    setIsDetailOpen,
    isApproveDialogOpen,
    setIsApproveDialogOpen,
    selectedCommission,
    setSelectedCommission,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editCommissionRate,
    setEditCommissionRate,
    editPayoutHt,
    setEditPayoutHt,
    editChangeReason,
    setEditChangeReason,
  };
}

export function useProduitsTab(): ProduitsTabState {
  const [selectedStatus, setSelectedStatus] = useState<
    AffiliateProductApprovalStatus | 'all'
  >('pending_approval');
  const dialogState = useProduitsTabDialogState();
  const {
    data: products,
    isLoading,
    refetch,
  } = useAllAffiliateProducts(
    selectedStatus === 'all' ? undefined : selectedStatus
  );
  const approveProduct = useApproveProduct();
  const updateProduct = useUpdateAffiliateProduct();
  const rejectProduct = useRejectProduct();
  const handleViewDetails = (product: PendingProduct) => {
    dialogState.setSelectedProduct(product);
    dialogState.setIsDetailOpen(true);
  };
  const setters: Setters = {
    setSelectedProduct: dialogState.setSelectedProduct,
    setIsApproveDialogOpen: dialogState.setIsApproveDialogOpen,
    setIsRejectDialogOpen: dialogState.setIsRejectDialogOpen,
    setIsDetailOpen: dialogState.setIsDetailOpen,
    setIsEditDialogOpen: dialogState.setIsEditDialogOpen,
    setSelectedCommission: dialogState.setSelectedCommission,
    setRejectReason: dialogState.setRejectReason,
    setEditCommissionRate: dialogState.setEditCommissionRate,
    setEditPayoutHt: dialogState.setEditPayoutHt,
    setEditChangeReason: dialogState.setEditChangeReason,
  };
  const { handleApproveClick, handleApproveConfirm } = makeApproveHandlers(
    dialogState.selectedProduct,
    dialogState.selectedCommission,
    approveProduct,
    refetch,
    setters
  );
  const { handleRejectClick, handleRejectConfirm } = makeRejectHandlers(
    dialogState.selectedProduct,
    dialogState.rejectReason,
    rejectProduct,
    refetch,
    setters
  );
  const { handleEditClick, handleEditConfirm } = makeEditHandlers(
    dialogState.selectedProduct,
    dialogState.editCommissionRate,
    dialogState.editPayoutHt,
    dialogState.editChangeReason,
    updateProduct,
    refetch,
    setters
  );
  return {
    selectedStatus,
    setSelectedStatus,
    ...dialogState,
    products,
    isLoading,
    approveProduct,
    rejectProduct,
    updateProduct,
    handleApproveClick,
    handleApproveConfirm,
    handleRejectClick,
    handleRejectConfirm,
    handleViewDetails,
    handleEditClick,
    handleEditConfirm,
  };
}
