'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@verone/ui';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

import {
  COMMISSION_RATES,
  type CommissionRate,
} from '../../hooks/use-product-approvals';
import type { ProduitsTabState } from './use-produits-tab';
import { getCommissionAmount, getAffiliateEarning } from './produits-tab-utils';

// ============================================================================
// APPROVE DIALOG
// ============================================================================

type ApproveDialogProps = Pick<
  ProduitsTabState,
  | 'isApproveDialogOpen'
  | 'setIsApproveDialogOpen'
  | 'selectedProduct'
  | 'selectedCommission'
  | 'setSelectedCommission'
  | 'approveProduct'
  | 'handleApproveConfirm'
>;

export function ApproveDialog({
  isApproveDialogOpen,
  setIsApproveDialogOpen,
  selectedProduct,
  selectedCommission,
  setSelectedCommission,
  approveProduct,
  handleApproveConfirm,
}: ApproveDialogProps) {
  return (
    <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Approuver le produit
          </DialogTitle>
          <DialogDescription>
            Definissez le taux de commission plateforme avant d&apos;approuver.
          </DialogDescription>
        </DialogHeader>
        {selectedProduct && (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <p className="font-medium">{selectedProduct.name}</p>
              <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  Payout affilié:{' '}
                  <span className="font-semibold">
                    {selectedProduct.affiliate_payout_ht?.toFixed(2)} EUR
                  </span>
                </span>
              </div>
            </div>
            <CommissionSelector
              selectedCommission={selectedCommission}
              setSelectedCommission={setSelectedCommission}
            />
            <ApproveRevenuePreview
              payout={selectedProduct.affiliate_payout_ht ?? 0}
              commission={selectedCommission}
            />
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsApproveDialogOpen(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleApproveConfirm().catch(error => {
                console.error('[Approbations] Approve confirm failed:', error);
              });
            }}
            disabled={approveProduct.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {approveProduct.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Confirmer l&apos;approbation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommissionSelector({
  selectedCommission,
  setSelectedCommission,
}: {
  selectedCommission: CommissionRate;
  setSelectedCommission: (v: CommissionRate) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Commission plateforme *
      </label>
      <div className="grid grid-cols-3 gap-2">
        {COMMISSION_RATES.map(rate => (
          <button
            key={rate}
            type="button"
            onClick={() => setSelectedCommission(rate)}
            className={`p-3 rounded-lg border-2 text-center transition-colors ${
              selectedCommission === rate
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-lg font-bold">{rate}%</span>
            {rate === 5 && (
              <span className="block text-xs text-gray-500">Défaut</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ApproveRevenuePreview({
  payout,
  commission,
}: {
  payout: number;
  commission: number;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <p className="text-sm font-medium text-gray-700">
        Repartition des revenus:
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Prix client (fixe):</span>
          <span className="text-lg font-bold text-gray-900">
            {payout.toFixed(2)} EUR
          </span>
        </div>
        <div className="flex items-center justify-between text-amber-700">
          <span>Commission Verone ({commission}%):</span>
          <span className="font-medium">
            -{getCommissionAmount(payout, commission).toFixed(2)} EUR
          </span>
        </div>
        <hr className="border-gray-300" />
        <div className="flex items-center justify-between text-green-700">
          <span className="font-medium">Affilie recoit:</span>
          <span className="text-lg font-bold">
            {getAffiliateEarning(payout, commission).toFixed(2)} EUR
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REJECT DIALOG
// ============================================================================

type RejectDialogProps = Pick<
  ProduitsTabState,
  | 'isRejectDialogOpen'
  | 'setIsRejectDialogOpen'
  | 'rejectReason'
  | 'setRejectReason'
  | 'rejectProduct'
  | 'handleRejectConfirm'
>;

export function RejectDialog({
  isRejectDialogOpen,
  setIsRejectDialogOpen,
  rejectReason,
  setRejectReason,
  rejectProduct,
  handleRejectConfirm,
}: RejectDialogProps) {
  return (
    <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Rejeter le produit
          </DialogTitle>
          <DialogDescription>
            Indiquez le motif du rejet. L&apos;affilie pourra corriger et
            resoumettre le produit.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Motif du rejet..."
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsRejectDialogOpen(false)}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              void handleRejectConfirm().catch(error => {
                console.error('[Approbations] Reject failed:', error);
              });
            }}
            disabled={!rejectReason.trim() || rejectProduct.isPending}
          >
            {rejectProduct.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Confirmer le rejet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
