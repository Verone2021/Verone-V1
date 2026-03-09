'use client';

import { useState } from 'react';

import {
  detectBankPaymentMethod,
  BANK_PAYMENT_METHODS,
} from '../lib/payment-methods';
import { getPcgCategory, getPcgColor } from '../lib/pcg-categories';
import type { UnifiedTransaction } from '../hooks/use-unified-transactions';
import type { TransactionForUpload } from './InvoiceUploadModal';
import { RapprochementModal } from './RapprochementModal';
import { InvoiceUploadModal } from './InvoiceUploadModal';
import { QuickClassificationModal } from './QuickClassificationModal';
import { OrganisationLinkingModal } from './OrganisationLinkingModal';
import { RuleModal } from './RuleModal';
import {
  useMatchingRules,
  type MatchingRule,
} from '../hooks/use-matching-rules';

import {
  Card,
  CardContent,
  Badge,
  Button,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  AlertCircle,
  FileText,
  ExternalLink,
  Paperclip,
  Building2,
  Settings,
  Tag,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  FileX,
  FileCheck,
  CreditCard,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date inconnue';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// =====================================================================
// TYPES
// =====================================================================

interface ApiErrorResponse {
  error?: string;
}

export interface TransactionDetailContentProps {
  transaction: UnifiedTransaction;
  onRefresh: () => Promise<void>;
  suggestionsMap?: Map<
    string,
    { matchedRule?: { id: string } | null } | undefined
  >;
  autoOpenRapprochement?: boolean;
  autoOpenUpload?: boolean;
  /** compact=true for Sheet (360px), compact=false for Dialog (672px) */
  compact?: boolean;
}

// =====================================================================
// COMPONENT — Headless content (no Shell/Dialog wrapper)
// =====================================================================

export function TransactionDetailContent({
  transaction,
  onRefresh,
  suggestionsMap,
  autoOpenRapprochement = false,
  autoOpenUpload = false,
  compact = true,
}: TransactionDetailContentProps) {
  // Modal states
  const [showRapprochementModal, setShowRapprochementModal] = useState(
    autoOpenRapprochement
  );
  const [showUploadModal, setShowUploadModal] = useState(autoOpenUpload);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [showOrganisationModal, setShowOrganisationModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<MatchingRule | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const {
    rules,
    update: updateRule,
    refetch: refetchRules,
    previewApply,
    confirmApply,
  } = useMatchingRules();

  const isLockedByRule = Boolean(transaction.applied_rule_id);

  const transactionForUpload: TransactionForUpload = {
    id: transaction.id,
    transaction_id: transaction.transaction_id,
    label: transaction.label ?? '',
    counterparty_name: transaction.counterparty_name,
    amount: transaction.amount,
    currency: 'EUR',
    emitted_at: transaction.emitted_at ?? '',
    has_attachment: transaction.has_attachment,
    matched_document_id: transaction.matched_document_id,
    order_number: null,
  };

  const handleToggleJustificationOptional = async (optional: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bank_transactions')
        .update({ justification_optional: optional })
        .eq('id', transaction.id);
      if (error) throw error;
      toast.success(
        optional ? 'Justificatif marqué facultatif' : 'Justificatif requis'
      );
      await onRefresh();
    } catch (_err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleViewRule = () => {
    if (!transaction.applied_rule_id) return;
    const rule = rules.find(r => r.id === transaction.applied_rule_id);
    if (rule) {
      setEditingRule(rule);
      setShowRuleModal(true);
    } else {
      toast.error('Règle non trouvée');
    }
  };

  const handleUpdateNote = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value.trim() || null;
    if (newNote === (transaction.note ?? null)) return;
    void (async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('bank_transactions')
          .update({ note: newNote })
          .eq('id', transaction.id);
        if (updateError) throw updateError;
        toast.success('Note sauvegardée');
        void onRefresh().catch(err => {
          console.error(
            '[TransactionDetailContent] Refresh after note update failed:',
            err
          );
        });
      } catch (err) {
        console.error('[Note update] Error:', err);
        toast.error('Erreur lors de la sauvegarde de la note');
      }
    })();
  };

  const handleUpdatePaymentMethod = (value: string) => {
    const newMethod = value === 'none' ? null : value;
    void (async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('bank_transactions')
          .update({ payment_method: newMethod })
          .eq('id', transaction.id);
        if (updateError) throw updateError;
        toast.success('Mode de paiement mis à jour');
        void onRefresh().catch(err => {
          console.error(
            '[TransactionDetailContent] Refresh after payment method update failed:',
            err
          );
        });
      } catch (err) {
        console.error('[Payment method update] Error:', err);
        toast.error('Erreur lors de la mise à jour');
      }
    })();
  };

  const handleUpdateVat = (value: string) => {
    void (async () => {
      const newRate = value === 'none' ? null : parseFloat(value);
      try {
        const res = await fetch('/api/transactions/update-vat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: transaction.id,
            vat_rate: newRate,
          }),
        });
        if (res.ok) {
          void onRefresh().catch(error => {
            console.error(
              '[TransactionDetailContent] Refresh after update failed:',
              error
            );
          });
        }
      } catch (err) {
        console.error('[TVA update] Error:', err);
      }
    })();
  };

  // Derived state for missing indicators
  const isMissingCategory = !transaction.category_pcg && !isLockedByRule;
  const isMissingVat = !transaction.vat_rate && transaction.amount !== null;
  const attachmentIds = transaction.attachment_ids ?? [];
  const attachments = attachmentIds.map((id, idx) => ({
    id,
    file_name: `Pièce jointe ${idx + 1}`,
  }));
  const hasAttachment = attachments.length > 0;
  const isMissingJustificatif =
    !hasAttachment && !transaction.justification_optional;

  // =====================================================================
  // Shared sub-components
  // =====================================================================

  const vatSourceBadge = (() => {
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
  })();

  const vatSelector = (
    <Select
      value={transaction.vat_rate?.toString() ?? 'none'}
      onValueChange={handleUpdateVat}
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

  const paymentMethodSelector = (
    <Select
      value={
        transaction.payment_method ??
        detectBankPaymentMethod(transaction.label ?? '') ??
        'none'
      }
      onValueChange={handleUpdatePaymentMethod}
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

  const attachmentsSection = (() => {
    const handleDeleteAttachment = async (attachmentId: string) => {
      if (
        !confirm('Supprimer ce justificatif ? Cette action est irréversible.')
      )
        return;
      try {
        const res = await fetch(
          `/api/qonto/attachments/${attachmentId}?transactionId=${transaction.id}`,
          { method: 'DELETE' }
        );
        if (!res.ok) {
          const err = (await res.json()) as ApiErrorResponse;
          throw new Error(err.error ?? 'Erreur lors de la suppression');
        }
        toast.success('Justificatif supprimé');
        void onRefresh().catch(error => {
          console.error(
            '[TransactionDetailContent] Refresh after delete failed:',
            error
          );
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Erreur lors de la suppression'
        );
      }
    };

    if (hasAttachment) {
      return (
        <div className="space-y-1">
          {attachments.map((att, idx) => (
            <div
              key={att.id ?? idx}
              className="flex items-center gap-1.5 group"
            >
              <button
                onClick={() =>
                  window.open(`/api/qonto/attachments/${att.id}`, '_blank')
                }
                className={cn(
                  'flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline flex-1 text-left',
                  compact ? 'text-xs' : 'text-sm'
                )}
              >
                <Paperclip
                  className={cn(
                    compact ? 'h-3 w-3' : 'h-3.5 w-3.5',
                    'flex-shrink-0'
                  )}
                />
                <span className="truncate">
                  {att.file_name || `Pièce jointe ${idx + 1}`}
                </span>
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
              <button
                onClick={() => {
                  void handleDeleteAttachment(att.id).catch(error => {
                    console.error(
                      '[TransactionDetailContent] Delete attachment failed:',
                      error
                    );
                  });
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-opacity"
                title="Supprimer ce justificatif"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div
            className={cn(
              'flex items-center gap-1 text-green-600',
              compact ? 'text-[10px]' : 'text-xs'
            )}
          >
            <CheckCircle className="h-3 w-3" />
            <span>{attachments.length} justificatif(s) déposé(s)</span>
          </div>
        </div>
      );
    }
    if (transaction.justification_optional) {
      return (
        <div
          className={cn(
            'flex items-center gap-1.5 text-slate-500',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          <FileX className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          <span>Non requis</span>
        </div>
      );
    }
    return (
      <button
        onClick={() => setShowUploadModal(true)}
        className={cn(
          'flex items-center gap-1.5 text-amber-600 hover:text-amber-800',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        <AlertCircle className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        <span>Manquant - Cliquer pour déposer</span>
      </button>
    );
  })();

  const technicalDetails = (() => {
    const rawData = transaction.raw_data as Record<string, unknown> | null;
    const reference =
      rawData && typeof rawData.reference === 'string'
        ? rawData.reference
        : null;
    if (!reference && !transaction.operation_type) return null;
    return (
      <div className={cn(compact ? 'mt-0.5' : 'mt-1')}>
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className={cn(
            'flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-full',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {showTechnicalDetails ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          Détails techniques
        </button>
        {showTechnicalDetails && (
          <div
            className={cn(
              'p-1.5 bg-muted/30 rounded space-y-0.5',
              compact ? 'mt-0.5 text-[10px]' : 'mt-1 text-xs'
            )}
          >
            {reference && (
              <div>
                <span className="text-muted-foreground">Réf : </span>
                <span className="font-mono break-all">{reference}</span>
              </div>
            )}
            {transaction.operation_type && (
              <div>
                <span className="text-muted-foreground">Type : </span>
                <span className="font-mono">{transaction.operation_type}</span>
              </div>
            )}
            {transaction.transaction_id && (
              <div>
                <span className="text-muted-foreground">ID : </span>
                <span className="font-mono break-all">
                  {transaction.transaction_id}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  })();

  // =====================================================================
  // ACTIONS (shared between both layouts)
  // =====================================================================

  const actionButtons = (
    <>
      {isLockedByRule && (
        <>
          <div
            className={cn(
              'bg-amber-50 border border-amber-200 rounded-lg',
              compact ? 'p-1 mb-0.5' : 'p-2 mb-1'
            )}
          >
            <div className="flex items-center gap-1.5 text-amber-700">
              <Lock className="h-3 w-3" />
              <span
                className={cn(
                  'font-medium',
                  compact ? 'text-[10px]' : 'text-xs'
                )}
              >
                Géré par règle
              </span>
            </div>
            <p
              className={cn(
                'text-amber-600 mt-0',
                compact ? 'text-[9px]' : 'text-[11px]'
              )}
            >
              Modifier via les règles ou la page Dépenses.
            </p>
          </div>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start gap-1.5',
              compact ? 'h-7 text-xs' : 'h-8 text-sm'
            )}
            onClick={handleViewRule}
          >
            <Settings className="h-3 w-3" />
            Voir / Modifier la règle
          </Button>
        </>
      )}
      {!isLockedByRule && !transaction.category_pcg && (
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start gap-1.5',
            compact ? 'h-7 text-xs' : 'h-8 text-sm'
          )}
          onClick={() => setShowClassificationModal(true)}
          data-testid="btn-classify-pcg"
        >
          <Tag className="h-3 w-3" />
          Classer PCG
        </Button>
      )}
      {!isLockedByRule &&
        !transaction.organisation_name &&
        transaction.side === 'debit' && (
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start gap-1.5',
              compact ? 'h-7 text-xs' : 'h-8 text-sm'
            )}
            onClick={() => setShowOrganisationModal(true)}
            data-testid="btn-link-org"
          >
            <Building2 className="h-3 w-3" />
            Lier organisation
          </Button>
        )}
      <Button
        variant="outline"
        className={cn(
          'w-full justify-start gap-1.5',
          compact ? 'h-7 text-xs' : 'h-8 text-sm'
        )}
        onClick={() => setShowRapprochementModal(true)}
      >
        <FileText className="h-3 w-3" />
        Rapprocher commande
      </Button>
      <Separator className="my-0.5" />
      {transaction.justification_optional ? (
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start gap-1.5 text-green-600 hover:text-green-700',
            compact ? 'h-7 text-xs' : 'h-8 text-sm'
          )}
          onClick={() => {
            void handleToggleJustificationOptional(false).catch(error => {
              console.error(
                '[TransactionDetailContent] Toggle justification failed:',
                error
              );
            });
          }}
        >
          <FileCheck className="h-3 w-3" />
          Justificatif requis
        </Button>
      ) : (
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-1.5 text-muted-foreground',
            compact ? 'h-7 text-xs' : 'h-8 text-sm'
          )}
          onClick={() => {
            void handleToggleJustificationOptional(true).catch(error => {
              console.error(
                '[TransactionDetailContent] Toggle justification failed:',
                error
              );
            });
          }}
        >
          <FileX className="h-3 w-3" />
          Justificatif facultatif
        </Button>
      )}
    </>
  );

  // =====================================================================
  // MODALS (shared)
  // =====================================================================

  const modals = (
    <>
      <QuickClassificationModal
        open={showClassificationModal}
        onOpenChange={setShowClassificationModal}
        label={transaction.label ?? transaction.counterparty_name ?? ''}
        amount={transaction.amount}
        transactionId={transaction.id}
        counterpartyName={transaction.counterparty_name ?? undefined}
        currentCategory={transaction.category_pcg ?? undefined}
        existingRuleId={
          suggestionsMap
            ? suggestionsMap.get(transaction.id)?.matchedRule?.id
            : undefined
        }
        onSuccess={() => {
          void onRefresh().catch(error => {
            console.error(
              '[TransactionDetailContent] Refresh after success failed:',
              error
            );
          });
        }}
      />
      <OrganisationLinkingModal
        open={showOrganisationModal}
        onOpenChange={setShowOrganisationModal}
        label={transaction.counterparty_name ?? transaction.label ?? ''}
        transactionCount={1}
        totalAmount={transaction.amount}
        onSuccess={() => {
          void onRefresh().catch(error => {
            console.error(
              '[TransactionDetailContent] Refresh after success failed:',
              error
            );
          });
        }}
        transactionSide={transaction.side}
      />
      <RapprochementModal
        open={showRapprochementModal}
        onOpenChange={setShowRapprochementModal}
        transactionId={transaction.id}
        label={transaction.label ?? transaction.counterparty_name ?? ''}
        amount={transaction.amount ?? 0}
        counterpartyName={transaction.counterparty_name}
        onSuccess={() => {
          toast.success('Transaction rapprochee');
          void onRefresh().catch(error => {
            console.error('[TransactionDetailContent] Refresh failed:', error);
          });
          setShowRapprochementModal(false);
        }}
      />
      <InvoiceUploadModal
        transaction={transactionForUpload}
        open={showUploadModal}
        onOpenChange={open => {
          setShowUploadModal(open);
        }}
        onUploadComplete={() => {
          toast.success('Justificatif uploadé');
          void onRefresh().catch(error => {
            console.error('[TransactionDetailContent] Refresh failed:', error);
          });
          setShowUploadModal(false);
        }}
      />
      <RuleModal
        open={showRuleModal}
        onOpenChange={setShowRuleModal}
        rule={editingRule}
        onUpdate={updateRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        onSuccess={() => {
          setEditingRule(null);
          void refetchRules().catch(error => {
            console.error(
              '[TransactionDetailContent] Refetch rules failed:',
              error
            );
          });
          void onRefresh().catch(error => {
            console.error('[TransactionDetailContent] Refresh failed:', error);
          });
        }}
      />
    </>
  );

  // =====================================================================
  // COMPACT LAYOUT (Sheet 360px) — original layout
  // =====================================================================

  if (compact) {
    return (
      <>
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
                <p className="text-xs font-medium">
                  {transaction.label ?? '-'}
                </p>
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
                  onBlur={handleUpdateNote}
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
                  <p className="text-xs text-muted-foreground">
                    Mode de paiement
                  </p>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    {paymentMethodSelector}
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
                          backgroundColor: getPcgColor(
                            transaction.category_pcg
                          ),
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
                    <p className="text-xs text-muted-foreground">
                      Organisation
                    </p>
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
                          <span>
                            {formatAmount(Math.abs(transaction.amount))}
                          </span>
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
                              {vatSourceBadge}
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
                        {vatSelector}
                      </div>
                    )}
                  </div>
                </>
              )}
              <Separator className="my-0.5" />
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px]">
                  Justificatif
                </p>
                {attachmentsSection}
              </div>
            </CardContent>
          </Card>
          {technicalDetails}
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground">
              Actions
            </p>
            {actionButtons}
          </div>
        </div>
        {modals}
      </>
    );
  }

  // =====================================================================
  // EXPANDED LAYOUT (Dialog 672px) — clean 2-column design
  // =====================================================================

  // Count missing items for summary
  const missingCount = [
    isMissingCategory,
    isMissingVat,
    isMissingJustificatif,
  ].filter(Boolean).length;

  return (
    <>
      <div className="space-y-4">
        {/* Header: Amount + Status + Missing alerts */}
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                'text-2xl font-bold',
                transaction.side === 'credit'
                  ? 'text-green-600'
                  : 'text-red-600'
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
              <p className="text-xs text-muted-foreground mb-0.5">
                Contrepartie
              </p>
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
                {paymentMethodSelector}
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
                          <p className="text-[10px] text-muted-foreground">
                            TVA
                          </p>
                          {vatSourceBadge}
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
                    {vatSelector}
                  </div>
                )}
              </div>
            )}

            {/* Justificatif */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Justificatif</p>
              {attachmentsSection}
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
            onBlur={handleUpdateNote}
          />
        </div>

        {technicalDetails}

        {/* Actions */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Actions</p>
          {actionButtons}
        </div>
      </div>
      {modals}
    </>
  );
}
