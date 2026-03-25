'use client';

import { Button } from '@verone/ui';
import {
  Package,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Warehouse,
  User,
  Pencil,
} from 'lucide-react';

import type { PendingProduct } from '../../hooks/use-product-approvals';
import { STATUS_OPTIONS } from './produits-tab-types';
import { StatusBadge, getCommissionAmount } from './produits-tab-utils';
import type { ProduitsTabState } from './use-produits-tab';

// ============================================================================
// STATUS FILTER BAR
// ============================================================================

type FilterBarProps = Pick<
  ProduitsTabState,
  'selectedStatus' | 'setSelectedStatus'
>;

export function FilterBar({
  selectedStatus,
  setSelectedStatus,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Filter className="h-4 w-4 text-gray-400" />
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {STATUS_OPTIONS.map(option => {
          const Icon = option.icon;
          const isActive = selectedStatus === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-white shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${option.color}`} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

export function ProductsLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

type EmptyStateProps = Pick<ProduitsTabState, 'selectedStatus'>;

export function ProductsEmptyState({ selectedStatus }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl p-12 text-center border">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Aucun produit
      </h2>
      <p className="text-gray-500">
        {selectedStatus === 'pending_approval'
          ? 'Aucun produit en attente de validation'
          : 'Aucun produit affilie trouve'}
      </p>
    </div>
  );
}

// ============================================================================
// STORAGE CELL
// ============================================================================

function StorageCell({ product }: { product: PendingProduct }) {
  if (product.affiliate_storage_type === 'verone') {
    return (
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-blue-100 rounded">
          <Warehouse className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-700">Chez Verone</p>
          <p className="text-xs text-gray-500">
            {product.affiliate_stock_quantity} unites
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-gray-100 rounded">
        <User className="h-4 w-4 text-gray-500" />
      </div>
      <p className="text-sm text-gray-600">Gere par l&apos;affilie</p>
    </div>
  );
}

// ============================================================================
// ACTION BUTTONS CELL
// ============================================================================

type ActionCellProps = {
  product: PendingProduct;
  onView: (p: PendingProduct) => void;
  onEdit: (p: PendingProduct) => void;
  onReject: (p: PendingProduct) => void;
  onApprove: (p: PendingProduct) => void;
};

function ActionCell({
  product,
  onView,
  onEdit,
  onReject,
  onApprove,
}: ActionCellProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => onView(product)}>
        <Eye className="h-4 w-4" />
      </Button>
      {product.affiliate_approval_status === 'approved' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(product)}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Pencil className="h-4 w-4 mr-1" />
          Modifier
        </Button>
      )}
      {product.affiliate_approval_status === 'pending_approval' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(product)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rejeter
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove(product)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approuver
          </Button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// PRODUCT ROW
// ============================================================================

type ProductRowProps = {
  product: PendingProduct;
  onView: (p: PendingProduct) => void;
  onEdit: (p: PendingProduct) => void;
  onReject: (p: PendingProduct) => void;
  onApprove: (p: PendingProduct) => void;
};

function ProductRow({
  product,
  onView,
  onEdit,
  onReject,
  onApprove,
}: ProductRowProps) {
  return (
    <tr key={product.id} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-500">{product.sku}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="text-gray-900">
            {product.affiliate_display_name ?? '-'}
          </p>
          <p className="text-sm text-gray-500">
            {product.enseigne_name ?? '-'}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-semibold">
            {product.affiliate_payout_ht?.toFixed(2)} EUR
          </p>
          <p className="text-xs text-gray-500">
            Commission: {product.affiliate_commission_rate ?? 0}% ={' '}
            {getCommissionAmount(
              product.affiliate_payout_ht ?? 0,
              product.affiliate_commission_rate ?? 0
            ).toFixed(2)}{' '}
            EUR
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <StorageCell product={product} />
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={product.affiliate_approval_status} />
      </td>
      <td className="px-6 py-4">
        <ActionCell
          product={product}
          onView={onView}
          onEdit={onEdit}
          onReject={onReject}
          onApprove={onApprove}
        />
      </td>
    </tr>
  );
}

// ============================================================================
// PRODUCTS TABLE
// ============================================================================

type ProductsTableProps = {
  products: PendingProduct[];
  onView: (p: PendingProduct) => void;
  onEdit: (p: PendingProduct) => void;
  onReject: (p: PendingProduct) => void;
  onApprove: (p: PendingProduct) => void;
};

export function ProductsTable({
  products,
  onView,
  onEdit,
  onReject,
  onApprove,
}: ProductsTableProps) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Produit
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Affilie
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Prix
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Stockage
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Statut
            </th>
            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map(product => (
            <ProductRow
              key={product.id}
              product={product}
              onView={onView}
              onEdit={onEdit}
              onReject={onReject}
              onApprove={onApprove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
