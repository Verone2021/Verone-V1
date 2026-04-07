'use client';

import type { UnifiedTransaction } from '../../hooks/use-unified-transactions';
import type { TransactionHandlers } from './useTransactionHandlers';
import { TransactionDetailAttachments } from './TransactionDetailAttachments';
import { TransactionDetailActions } from './TransactionDetailActions';
import { TransactionDetailTechnicalDetails } from './TransactionDetailTechnicalDetails';
import {
  VatSourceBadge,
  VatSelector,
  PaymentMethodSelector,
} from './TransactionDetailTvaSection';
import { formatDate, formatAmount } from './helpers';
import { getPcgCategory, getPcgColor } from '../../lib/pcg-categories';
import { Badge, Separator, Textarea } from '@verone/ui';
import { AlertCircle, StickyNote, CreditCard } from 'lucide-react';
import { cn } from '@verone/utils';

// =====================================================================
// COMPONENT — Expanded Dialog layout (672px, 2 columns)
// =====================================================================

interface TransactionDetailExpandedLayoutProps {
  transaction: UnifiedTransaction;
  onRefresh: () => Promise<void>;
  isLockedByRule: boolean;
  isMissingCategory: boolean;
  isMissingVat: boolean;
  isMissingJustificatif: boolean;
  handlers: TransactionHandlers;
  showTechnicalDetails: boolean;
  setShowTechnicalDetails: (show: boolean) => void;
  setShowRapprochementModal: (open: boolean) => void;
  setShowClassificationModal: (open: boolean) => void;
  setShowOrganisationModal: (open: boolean) => void;
  setShowUploadModal: (open: boolean) => void;
}

export function TransactionDetailExpandedLayout({
  transaction,
  onRefresh,
  isLockedByRule,
  isMissingCategory,
  isMissingVat,
  isMissingJustificatif,
  handlers,
  showTechnicalDetails,
  setShowTechnicalDetails,
  setShowRapprochementModal,
  setShowClassificationModal,
  setShowOrganisationModal,
  setShowUploadModal,
}: TransactionDetailExpandedLayoutProps) {
  const compact = false;

  const missingCount = [
    isMissingCategory,
    isMissingVat,
    isMissingJustificatif,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header: Amount + Status + Missing alerts */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              'text-2xl font-bold',
              transaction.side === 'credit' ? 'text-green-600' : 'text-red-600'
            )}
          >
            {transaction.side === 'credit' ? '+' : ''}
            {formatAmount(
              transaction.side === 'credit'
                ? Math.abs(transaction.amount)
                : -Math.abs(transaction.amount)
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {transaction.label ?? transaction.counterparty_name ?? '-'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-muted-foreground">
            {formatDate(transaction.settled_at ?? transaction.emitted_at)}
          </p>
          {transaction.unified_status === 'to_process' && (
            <Badge variant="warning">A traiter</Badge>
          )}
          {transaction.unified_status === 'classified' && (
            <Badge variant="secondary">Classee</Badge>
          )}
          {transaction.unified_status === 'matched' && (
            <Badge variant="default" className="bg-green-600">
              Rapprochee
            </Badge>
          )}
          {transaction.unified_status === 'ignored' && (
            <Badge variant="secondary">Ignoree</Badge>
          )}
          {transaction.unified_status === 'cca' && (
            <Badge variant="default" className="bg-purple-600">
              CCA 455
            </Badge>
          )}
        </div>
      </div>

      {/* Missing items alert */}
      {missingCount > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {isMissingCategory && (
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-700 bg-amber-50"
              >
                Catégorie manquante
              </Badge>
            )}
            {isMissingVat && (
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-700 bg-amber-50"
              >
                TVA non définie
              </Badge>
            )}
            {isMissingJustificatif && (
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-700 bg-amber-50"
              >
                Justificatif manquant
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT column: Info */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Contrepartie</p>
            <p className="text-sm font-medium">
              {transaction.counterparty_name ?? '-'}
            </p>
          </div>

          {transaction.category_pcg ? (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Catégorie comptable
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: getPcgColor(transaction.category_pcg),
                  }}
                />
                <span className="text-sm font-medium">
                  {getPcgCategory(transaction.category_pcg)?.label ??
                    transaction.category_pcg}
                </span>
                <Badge variant="outline" className="text-xs">
                  {transaction.category_pcg}
                </Badge>
              </div>
            </div>
          ) : !isLockedByRule ? (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Catégorie comptable
              </p>
              <p className="text-sm text-amber-600 italic">Non classée</p>
            </div>
          ) : null}

          {transaction.organisation_name && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Organisation
              </p>
              <p className="text-sm font-medium text-blue-600">
                {transaction.organisation_name}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Mode de paiement
            </p>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <PaymentMethodSelector
                transaction={transaction}
                compact={compact}
                onUpdatePaymentMethod={handlers.handleUpdatePaymentMethod}
              />
            </div>
          </div>
        </div>

        {/* RIGHT column: TVA + Justificatif */}
        <div className="space-y-3">
          {/* TVA */}
          {transaction.amount !== null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">TVA</p>
              {transaction.vat_breakdown &&
              transaction.vat_breakdown.length > 0 ? (
                <div className="space-y-1">
                  {transaction.vat_breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.description || `TVA ${item.tva_rate}%`}
                      </span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatAmount(item.amount_ht)} HT
                        </span>
                        <span className="text-muted-foreground ml-1.5">
                          ({formatAmount(item.tva_amount)})
                        </span>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-medium text-sm">
                    <span>Total TTC</span>
                    <span>{formatAmount(Math.abs(transaction.amount))}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/40 rounded p-1.5">
                      <p className="text-[10px] text-muted-foreground">HT</p>
                      <p className="text-sm font-medium">
                        {transaction.amount_ht
                          ? formatAmount(transaction.amount_ht)
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded p-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <p className="text-[10px] text-muted-foreground">TVA</p>
                        <VatSourceBadge
                          transaction={transaction}
                          compact={compact}
                        />
                      </div>
                      <p className="text-sm font-medium">
                        {transaction.amount_vat
                          ? formatAmount(transaction.amount_vat)
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded p-1.5">
                      <p className="text-[10px] text-muted-foreground">TTC</p>
                      <p className="text-sm font-semibold">
                        {formatAmount(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  </div>
                  <VatSelector
                    transaction={transaction}
                    compact={compact}
                    onUpdateVat={handlers.handleUpdateVat}
                  />
                </div>
              )}
            </div>
          )}

          {/* Justificatif */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Justificatif</p>
            <TransactionDetailAttachments
              transaction={transaction}
              onRefresh={onRefresh}
              compact={compact}
              setShowUploadModal={setShowUploadModal}
            />
          </div>
        </div>
      </div>

      {/* Note (full-width, discrete) */}
      <div className="border rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">Note</p>
        </div>
        <Textarea
          key={transaction.id + '-note'}
          defaultValue={transaction.note ?? ''}
          placeholder="Ajouter une note..."
          className="text-sm min-h-[32px] h-auto resize-none border-0 p-0 focus-visible:ring-0 shadow-none"
          rows={1}
          onBlur={handlers.handleUpdateNote}
        />
      </div>

      <TransactionDetailTechnicalDetails
        transaction={transaction}
        compact={compact}
        showTechnicalDetails={showTechnicalDetails}
        setShowTechnicalDetails={setShowTechnicalDetails}
      />

      {/* Actions */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Actions</p>
        <TransactionDetailActions
          transaction={transaction}
          compact={compact}
          isLockedByRule={isLockedByRule}
          handlers={handlers}
          setShowRapprochementModal={setShowRapprochementModal}
          setShowClassificationModal={setShowClassificationModal}
          setShowOrganisationModal={setShowOrganisationModal}
        />
      </div>
    </div>
  );
}
