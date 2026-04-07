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
import { Card, CardContent, Badge, Separator, Textarea } from '@verone/ui';
import { StickyNote, CreditCard } from 'lucide-react';

// =====================================================================
// COMPONENT — Compact Sheet layout (360px)
// =====================================================================

interface TransactionDetailCompactLayoutProps {
  transaction: UnifiedTransaction;
  onRefresh: () => Promise<void>;
  isLockedByRule: boolean;
  handlers: TransactionHandlers;
  showTechnicalDetails: boolean;
  setShowTechnicalDetails: (show: boolean) => void;
  setShowRapprochementModal: (open: boolean) => void;
  setShowClassificationModal: (open: boolean) => void;
  setShowOrganisationModal: (open: boolean) => void;
  setShowUploadModal: (open: boolean) => void;
}

export function TransactionDetailCompactLayout({
  transaction,
  onRefresh,
  isLockedByRule,
  handlers,
  showTechnicalDetails,
  setShowTechnicalDetails,
  setShowRapprochementModal,
  setShowClassificationModal,
  setShowOrganisationModal,
  setShowUploadModal,
}: TransactionDetailCompactLayoutProps) {
  const compact = true;

  return (
    <div className="space-y-1.5">
      {/* Montant */}
      <div className="text-center py-0.5">
        <p
          className={`text-lg font-bold ${transaction.side === 'credit' ? 'text-green-600' : 'text-red-600'}`}
        >
          {transaction.side === 'credit' ? '+' : ''}
          {formatAmount(
            transaction.side === 'credit'
              ? Math.abs(transaction.amount)
              : -Math.abs(transaction.amount)
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(transaction.settled_at ?? transaction.emitted_at)}
        </p>
        <div className="mt-0.5">
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

      <Card>
        <CardContent className="pt-1 pb-1 space-y-1 text-xs">
          <div>
            <p className="text-xs text-muted-foreground">Libelle</p>
            <p className="text-xs font-medium">{transaction.label ?? '-'}</p>
          </div>
          <div className="mt-1 p-1.5 bg-blue-50 border border-blue-100 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <StickyNote className="h-3 w-3 text-blue-500" />
              <p className="text-[10px] font-medium text-blue-700">Note</p>
            </div>
            <Textarea
              key={transaction.id + '-note'}
              defaultValue={transaction.note ?? ''}
              placeholder="Ajouter une note..."
              className="text-xs min-h-[40px] h-auto resize-none bg-white border-blue-200 focus:border-blue-400"
              rows={2}
              onBlur={handlers.handleUpdateNote}
            />
          </div>
          <Separator className="my-0.5" />
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <p className="text-xs text-muted-foreground">Contrepartie</p>
              <p className="text-xs font-medium">
                {transaction.counterparty_name ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mode de paiement</p>
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-muted-foreground" />
                <PaymentMethodSelector
                  transaction={transaction}
                  compact={compact}
                  onUpdatePaymentMethod={handlers.handleUpdatePaymentMethod}
                />
              </div>
            </div>
          </div>
          {transaction.category_pcg && (
            <>
              <Separator className="my-0.5" />
              <div>
                <p className="text-muted-foreground text-[10px]">
                  Catégorie comptable
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getPcgColor(transaction.category_pcg),
                    }}
                  />
                  <span className="text-xs font-medium">
                    {getPcgCategory(transaction.category_pcg)?.label ??
                      transaction.category_pcg}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {transaction.category_pcg}
                  </Badge>
                </div>
              </div>
            </>
          )}
          {transaction.organisation_name && (
            <>
              <Separator className="my-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Organisation</p>
                <p className="text-xs font-medium text-blue-600">
                  {transaction.organisation_name}
                </p>
              </div>
            </>
          )}
          {transaction.amount !== null && (
            <>
              <Separator className="my-0.5" />
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px]">
                  Montants TVA
                </p>
                {transaction.vat_breakdown &&
                transaction.vat_breakdown.length > 0 ? (
                  <div className="space-y-0.5">
                    {transaction.vat_breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-muted-foreground">
                          {item.description || `TVA ${item.tva_rate}%`}
                        </span>
                        <div className="text-right">
                          <span className="font-medium">
                            {formatAmount(item.amount_ht)} HT
                          </span>
                          <span className="text-muted-foreground ml-2">
                            ({formatAmount(item.tva_amount)} TVA)
                          </span>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total TTC</span>
                      <span>{formatAmount(Math.abs(transaction.amount))}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground">HT</span>
                        <span className="font-medium">
                          {transaction.amount_ht
                            ? formatAmount(transaction.amount_ht)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">TVA</span>
                          <VatSourceBadge
                            transaction={transaction}
                            compact={compact}
                          />
                        </div>
                        <span className="font-medium">
                          {transaction.amount_vat
                            ? formatAmount(transaction.amount_vat)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground">TTC</span>
                        <span className="font-semibold">
                          {formatAmount(Math.abs(transaction.amount))}
                        </span>
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
            </>
          )}
          <Separator className="my-0.5" />
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-[10px]">Justificatif</p>
            <TransactionDetailAttachments
              transaction={transaction}
              onRefresh={onRefresh}
              compact={compact}
              setShowUploadModal={setShowUploadModal}
            />
          </div>
        </CardContent>
      </Card>
      <TransactionDetailTechnicalDetails
        transaction={transaction}
        compact={compact}
        showTechnicalDetails={showTechnicalDetails}
        setShowTechnicalDetails={setShowTechnicalDetails}
      />
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground">Actions</p>
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
