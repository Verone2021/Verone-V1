'use client';

import { Fragment } from 'react';

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ExpandIcon,
  Inbox,
} from 'lucide-react';

import type { CommissionItem, CommissionStatus } from '../../types/analytics';
import {
  formatCurrency,
  COMMISSION_STATUS_LABELS,
} from '../../types/analytics';
import { CommissionDetailContent } from './CommissionDetailContent';
import { ITEMS_PER_PAGE } from './commissions-table.types';

// ---- Helpers ----

export const isPayableStatus = (status: CommissionStatus | null): boolean =>
  status === 'validated' || status === 'payable';

// ---- StatusBadge ----

export function StatusBadge({
  status,
}: {
  status: CommissionStatus;
}): JSX.Element {
  const colorClasses: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    validated: 'bg-teal-100 text-teal-700',
    payable: 'bg-teal-100 text-teal-700',
    requested: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${colorClasses[status] ?? colorClasses.pending}`}
    >
      {COMMISSION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ---- Checkbox ----

export function Checkbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300 hover:border-teal-400'}`}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </button>
  );
}

// ---- CommissionRow ----

export function CommissionRow({
  commission,
  isSelected,
  onSelect,
  showCheckbox,
  isExpanded,
  onToggleExpand,
}: {
  commission: CommissionItem;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  showCheckbox: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}): JSX.Element {
  const date = commission.orderDate
    ? new Date(commission.orderDate).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

  const isPayable = isPayableStatus(commission.status);
  const colCount = showCheckbox ? 10 : 9;

  return (
    <Fragment>
      <tr
        className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-teal-50/50' : ''}`}
        onClick={onToggleExpand}
      >
        <td className="px-2 py-2.5 w-8">
          <ExpandIcon
            className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </td>
        {showCheckbox && (
          <td className="px-3 py-2.5 w-10" onClick={e => e.stopPropagation()}>
            {isPayable ? (
              <Checkbox
                checked={isSelected}
                onChange={checked => onSelect(commission.id, checked)}
              />
            ) : (
              <div className="w-4 h-4" />
            )}
          </td>
        )}
        <td className="px-3 py-2.5 text-xs text-gray-600">{date}</td>
        <td className="px-3 py-2.5 text-xs font-medium text-gray-900">
          #{commission.orderNumber}
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[150px] truncate">
          {commission.customerName ?? commission.selectionName}
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600">
          {formatCurrency(commission.orderAmountHT)}
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600">
          {formatCurrency(commission.orderAmountTTC)}
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-600">
          {formatCurrency(commission.totalPayoutHT)}
        </td>
        <td className="px-3 py-2.5 text-xs font-semibold text-emerald-600">
          {formatCurrency(commission.totalPayoutTTC)}
        </td>
        <td className="px-3 py-2.5">
          <StatusBadge status={commission.status} />
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50/30">
          <td colSpan={colCount} className="px-6 py-1">
            <CommissionDetailContent
              key={commission.orderId}
              commission={commission}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

// ---- SkeletonRow ----

export function SkeletonRow({
  showCheckbox,
}: {
  showCheckbox: boolean;
}): JSX.Element {
  return (
    <tr className="animate-pulse">
      <td className="px-2 py-2.5">
        <div className="h-3.5 w-3.5 bg-gray-200 rounded" />
      </td>
      {showCheckbox && (
        <td className="px-3 py-2.5">
          <div className="h-4 w-4 bg-gray-200 rounded" />
        </td>
      )}
      {[16, 20, 24, 16, 16, 14, 14].map((w, i) => (
        <td key={i} className="px-3 py-2.5">
          <div className={`h-3 bg-gray-200 rounded w-${w}`} />
        </td>
      ))}
      <td className="px-3 py-2.5">
        <div className="h-4 bg-gray-200 rounded-full w-16" />
      </td>
    </tr>
  );
}

// ---- EmptyState ----

export function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="h-10 w-10 mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ---- Pagination ----

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}): JSX.Element {
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-500">
        Affichage {startItem}-{endItem} sur {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 text-xs rounded-lg transition-colors ${currentPage === pageNum ? 'bg-teal-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
