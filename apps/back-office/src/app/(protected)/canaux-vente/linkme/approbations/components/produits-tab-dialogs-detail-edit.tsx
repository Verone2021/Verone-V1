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
import {
  Loader2,
  Euro,
  Percent,
  Ruler,
  Warehouse,
  User,
  Pencil,
  History,
} from 'lucide-react';

import type { PendingProduct } from '../../hooks/use-product-approvals';
import type { ProduitsTabState } from './use-produits-tab';
import { getCommissionAmount, getAffiliateEarning } from './produits-tab-utils';

// ============================================================================
// DETAIL DIALOG
// ============================================================================

type DetailDialogProps = Pick<
  ProduitsTabState,
  'isDetailOpen' | 'setIsDetailOpen' | 'selectedProduct'
>;

export function DetailDialog({
  isDetailOpen,
  setIsDetailOpen,
  selectedProduct,
}: DetailDialogProps) {
  return (
    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Details du produit</DialogTitle>
        </DialogHeader>
        {selectedProduct && <DetailBody product={selectedProduct} />}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({ product }: { product: PendingProduct }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Nom</p>
          <p className="font-medium">{product.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">SKU</p>
          <p className="font-medium">{product.sku}</p>
        </div>
      </div>
      {product.description && (
        <div>
          <p className="text-sm text-gray-500">Description</p>
          <p className="text-gray-700">{product.description}</p>
        </div>
      )}
      <DetailFinancials product={product} />
      <DetailStorage product={product} />
      {product.dimensions && (
        <div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Ruler className="h-4 w-4" />
            Dimensions
          </p>
          <p className="text-gray-700">
            {product.dimensions.length_cm ?? '-'} x{' '}
            {product.dimensions.width_cm ?? '-'} x{' '}
            {product.dimensions.height_cm ?? '-'} cm
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Affilie</p>
          <p className="font-medium">{product.affiliate_display_name ?? '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Enseigne</p>
          <p className="font-medium">{product.enseigne_name ?? '-'}</p>
        </div>
      </div>
    </div>
  );
}

function DetailFinancials({ product }: { product: PendingProduct }) {
  const payout = product.affiliate_payout_ht ?? 0;
  const commission = product.affiliate_commission_rate ?? 0;
  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Euro className="h-4 w-4 text-gray-600" />
          <span className="text-gray-600">Prix client (fixe)</span>
        </div>
        <span className="font-bold text-gray-900">{payout.toFixed(2)} EUR</span>
      </div>
      <div className="flex items-center justify-between text-amber-700">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4" />
          <span>Commission Verone ({commission}%)</span>
        </div>
        <span className="font-medium">
          -{getCommissionAmount(payout, commission).toFixed(2)} EUR
        </span>
      </div>
      <hr className="border-gray-300" />
      <div className="flex items-center justify-between text-green-700">
        <div className="flex items-center gap-2">
          <Euro className="h-4 w-4" />
          <span className="font-medium">Affilie recoit</span>
        </div>
        <span className="font-bold text-lg">
          {getAffiliateEarning(payout, commission).toFixed(2)} EUR
        </span>
      </div>
    </div>
  );
}

function DetailStorage({ product }: { product: PendingProduct }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
        <Warehouse className="h-4 w-4" />
        Stockage
      </p>
      {product.affiliate_storage_type === 'verone' ? (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded">
            <Warehouse className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-700">Stocke chez Verone</p>
            <p className="text-sm text-gray-600">
              {product.affiliate_stock_quantity} unites a recevoir
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded">
            <User className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-700">Gere par l&apos;affilie</p>
            <p className="text-sm text-gray-500">
              Expedition directe par l&apos;affilie
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EDIT DIALOG
// ============================================================================

type EditDialogProps = Pick<
  ProduitsTabState,
  | 'isEditDialogOpen'
  | 'setIsEditDialogOpen'
  | 'selectedProduct'
  | 'editCommissionRate'
  | 'setEditCommissionRate'
  | 'editPayoutHt'
  | 'setEditPayoutHt'
  | 'editChangeReason'
  | 'setEditChangeReason'
  | 'updateProduct'
  | 'handleEditConfirm'
>;

export function EditDialog({
  isEditDialogOpen,
  setIsEditDialogOpen,
  selectedProduct,
  editCommissionRate,
  setEditCommissionRate,
  editPayoutHt,
  setEditPayoutHt,
  editChangeReason,
  setEditChangeReason,
  updateProduct,
  handleEditConfirm,
}: EditDialogProps) {
  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-500" />
            Modifier le produit
          </DialogTitle>
          <DialogDescription>
            Modifiez la commission et/ou le payout du produit affilie.
          </DialogDescription>
        </DialogHeader>
        {selectedProduct && (
          <EditBody
            name={selectedProduct.name}
            sku={selectedProduct.sku}
            editCommissionRate={editCommissionRate}
            setEditCommissionRate={setEditCommissionRate}
            editPayoutHt={editPayoutHt}
            setEditPayoutHt={setEditPayoutHt}
            editChangeReason={editChangeReason}
            setEditChangeReason={setEditChangeReason}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleEditConfirm().catch(error => {
                console.error('[Approbations] Edit confirm failed:', error);
              });
            }}
            disabled={updateProduct.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateProduct.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Pencil className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EditBodyProps = {
  name: string;
  sku: string;
  editCommissionRate: number;
  setEditCommissionRate: (v: number) => void;
  editPayoutHt: number;
  setEditPayoutHt: (v: number) => void;
  editChangeReason: string;
  setEditChangeReason: (v: string) => void;
};

function EditBody({
  name,
  sku,
  editCommissionRate,
  setEditCommissionRate,
  editPayoutHt,
  setEditPayoutHt,
  editChangeReason,
  setEditChangeReason,
}: EditBodyProps) {
  return (
    <div className="py-4 space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{sku}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Commission Verone (%)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={editCommissionRate}
          onChange={e => setEditCommissionRate(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payout affilie (EUR HT)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={editPayoutHt}
          onChange={e => setEditPayoutHt(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Raison du changement (optionnel)
        </label>
        <Textarea
          value={editChangeReason}
          onChange={e => setEditChangeReason(e.target.value)}
          placeholder="Ex: Ajustement suite a negociation..."
          rows={2}
        />
      </div>
      <EditPreview
        editPayoutHt={editPayoutHt}
        editCommissionRate={editCommissionRate}
      />
    </div>
  );
}

function EditPreview({
  editPayoutHt,
  editCommissionRate,
}: {
  editPayoutHt: number;
  editCommissionRate: number;
}) {
  return (
    <div className="p-4 bg-blue-50 rounded-lg space-y-2">
      <p className="text-sm font-medium text-blue-700 flex items-center gap-2">
        <History className="h-4 w-4" />
        Apercu apres modification:
      </p>
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Prix client:</span>
          <span className="font-medium">{editPayoutHt.toFixed(2)} EUR</span>
        </div>
        <div className="flex justify-between text-amber-700">
          <span>Commission Verone ({editCommissionRate}%):</span>
          <span>
            -{getCommissionAmount(editPayoutHt, editCommissionRate).toFixed(2)}{' '}
            EUR
          </span>
        </div>
        <hr className="border-blue-200" />
        <div className="flex justify-between text-green-700 font-medium">
          <span>Affilie recoit:</span>
          <span>
            {getAffiliateEarning(editPayoutHt, editCommissionRate).toFixed(2)}{' '}
            EUR
          </span>
        </div>
      </div>
    </div>
  );
}
