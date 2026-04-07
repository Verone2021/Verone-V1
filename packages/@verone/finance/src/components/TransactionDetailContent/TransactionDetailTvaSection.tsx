'use client';

import type { UnifiedTransaction } from '../../hooks/use-unified-transactions';
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  BANK_PAYMENT_METHODS,
  detectBankPaymentMethod,
} from '../../lib/payment-methods';
import { cn } from '@verone/utils';

// =====================================================================
// COMPONENT — TVA badge + VAT selector + Payment method selector
// =====================================================================

interface TransactionDetailTvaSectionProps {
  transaction: UnifiedTransaction;
  compact: boolean;
  onUpdateVat: (value: string) => void;
  onUpdatePaymentMethod: (value: string) => void;
}

export function VatSourceBadge({
  transaction,
  compact,
}: {
  transaction: UnifiedTransaction;
  compact: boolean;
}) {
  if (transaction.vat_source === 'qonto_ocr') {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'px-1 py-0',
          compact ? 'text-[8px]' : 'text-[10px]',
          'bg-green-100 text-green-700'
        )}
      >
        OCR
      </Badge>
    );
  }
  if (transaction.vat_source === 'manual') {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'px-1 py-0',
          compact ? 'text-[8px]' : 'text-[10px]',
          'bg-blue-100 text-blue-700'
        )}
      >
        Manuel
      </Badge>
    );
  }
  if (transaction.vat_rate) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'px-1 py-0',
          compact ? 'text-[8px]' : 'text-[10px]',
          'bg-gray-100 text-gray-600'
        )}
      >
        Règle
      </Badge>
    );
  }
  return null;
}

export function VatSelector({
  transaction,
  compact,
  onUpdateVat,
}: Pick<
  TransactionDetailTvaSectionProps,
  'transaction' | 'compact' | 'onUpdateVat'
>) {
  return (
    <Select
      value={transaction.vat_rate?.toString() ?? 'none'}
      onValueChange={onUpdateVat}
    >
      <SelectTrigger className={cn(compact ? 'h-5 text-[9px]' : 'h-7 text-xs')}>
        <SelectValue placeholder="Taux TVA" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Non défini</SelectItem>
        <SelectItem value="0">0%</SelectItem>
        <SelectItem value="5.5">5.5%</SelectItem>
        <SelectItem value="10">10%</SelectItem>
        <SelectItem value="20">20%</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function PaymentMethodSelector({
  transaction,
  compact,
  onUpdatePaymentMethod,
}: Pick<
  TransactionDetailTvaSectionProps,
  'transaction' | 'compact' | 'onUpdatePaymentMethod'
>) {
  return (
    <Select
      value={
        transaction.payment_method ??
        detectBankPaymentMethod(transaction.label ?? '') ??
        'none'
      }
      onValueChange={onUpdatePaymentMethod}
    >
      <SelectTrigger
        className={cn(compact ? 'h-6 text-xs' : 'h-8 text-sm', 'w-full')}
      >
        <SelectValue placeholder="Non défini" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Non défini</SelectItem>
        {BANK_PAYMENT_METHODS.map(pm => (
          <SelectItem key={pm.value} value={pm.value}>
            {pm.icon} {pm.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
