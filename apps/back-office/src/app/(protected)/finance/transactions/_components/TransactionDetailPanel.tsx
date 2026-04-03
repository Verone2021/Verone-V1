'use client';

import { getPcgCategory, getPcgColor } from '@verone/finance';
import type { UnifiedTransaction } from '@verone/finance/hooks';
import {
  Card,
  CardContent,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Separator,
  Textarea,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Building2,
  CreditCard,
  StickyNote,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

import { TransactionAttachments } from './TransactionAttachments';
import { TransactionPanelActions } from './TransactionPanelActions';
import {
  formatDate,
  formatAmount,
  getPaymentMethodDisplay,
} from './transaction-helpers';

interface TransactionDetailPanelProps {
  selectedTransaction: UnifiedTransaction | null;
  isLockedByRule: boolean;
  suggestionsMap: Map<
    string,
    { matchedRule?: { id: string } | null } | undefined
  >;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onOpenClassificationModal: () => void;
  onOpenOrganisationModal: () => void;
  onOpenRapprochementModal: () => void;
  onOpenUploadModal: (tx: UnifiedTransaction) => void;
  onViewRule: () => void;
}

export function TransactionDetailPanel({
  selectedTransaction,
  isLockedByRule,
  onClose,
  onRefresh,
  onOpenClassificationModal,
  onOpenOrganisationModal,
  onOpenRapprochementModal,
  onOpenUploadModal,
  onViewRule,
}: TransactionDetailPanelProps) {
  return (
    <Sheet
      open={selectedTransaction !== null}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="w-[520px] sm:max-w-[520px] overflow-y-auto"
        data-testid="tx-side-panel"
      >
        {selectedTransaction && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-1 text-sm">
                {selectedTransaction.side === 'credit' ? (
                  <ArrowDownLeft className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-red-600" />
                )}
                Detail transaction
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-1.5 mt-1.5">
              {/* Montant + statut */}
              <div className="text-center py-0.5">
                <p
                  className={`text-lg font-bold ${selectedTransaction.side === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {selectedTransaction.side === 'credit' ? '+' : ''}
                  {formatAmount(
                    selectedTransaction.side === 'credit'
                      ? Math.abs(selectedTransaction.amount)
                      : -Math.abs(selectedTransaction.amount)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(
                    selectedTransaction.settled_at ??
                      selectedTransaction.emitted_at
                  )}
                </p>
                <div className="mt-0.5">
                  {selectedTransaction.unified_status === 'to_process' && (
                    <Badge variant="warning">A traiter</Badge>
                  )}
                  {selectedTransaction.unified_status === 'classified' && (
                    <Badge variant="secondary">Classee</Badge>
                  )}
                  {selectedTransaction.unified_status === 'matched' && (
                    <Badge variant="default" className="bg-green-600">
                      Rapprochee
                    </Badge>
                  )}
                  {selectedTransaction.unified_status === 'ignored' && (
                    <Badge variant="secondary">Ignoree</Badge>
                  )}
                  {selectedTransaction.unified_status === 'cca' && (
                    <Badge variant="default" className="bg-purple-600">
                      CCA 455
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <Card>
                <CardContent className="pt-1 pb-1 space-y-1 text-xs">
                  <div>
                    <p className="text-xs text-muted-foreground">Libelle</p>
                    <p className="text-xs font-medium">
                      {selectedTransaction.label ?? '-'}
                    </p>
                  </div>

                  {/* Note éditable */}
                  <div className="mt-1 p-1.5 bg-blue-50 border border-blue-100 rounded">
                    <div className="flex items-center gap-1 mb-0.5">
                      <StickyNote className="h-3 w-3 text-blue-500" />
                      <p className="text-[10px] font-medium text-blue-700">
                        Note
                      </p>
                    </div>
                    <Textarea
                      key={selectedTransaction.id + '-note'}
                      defaultValue={selectedTransaction.note ?? ''}
                      placeholder="Ajouter une note..."
                      className="text-xs min-h-[40px] h-auto resize-none bg-white border-blue-200 focus:border-blue-400"
                      rows={2}
                      onBlur={e => {
                        const newNote = e.target.value.trim() || null;
                        if (newNote === (selectedTransaction.note ?? null))
                          return;
                        void (async () => {
                          try {
                            const supabase = createClient();
                            const { error: updateError } = await supabase
                              .from('bank_transactions')
                              .update({ note: newNote })
                              .eq('id', selectedTransaction.id);
                            if (updateError) throw updateError;
                            toast.success('Note sauvegardée');
                            void onRefresh().catch(err => {
                              console.error(
                                '[Transactions] Refresh after note update failed:',
                                err
                              );
                            });
                          } catch (err) {
                            console.error('[Note update] Error:', err);
                            toast.error(
                              'Erreur lors de la sauvegarde de la note'
                            );
                          }
                        })();
                      }}
                    />
                  </div>

                  <Separator className="my-0.5" />

                  {/* Mode de paiement */}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Mode de paiement
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {(() => {
                          const pm =
                            getPaymentMethodDisplay(selectedTransaction);
                          return pm ? pm.label : 'Non renseigne';
                        })()}
                      </span>
                    </div>
                  </div>

                  {selectedTransaction.category_pcg && (
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
                                selectedTransaction.category_pcg
                              ),
                            }}
                          />
                          <span className="text-xs font-medium">
                            {getPcgCategory(selectedTransaction.category_pcg)
                              ?.label ?? selectedTransaction.category_pcg}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {selectedTransaction.category_pcg}
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedTransaction.organisation_name && (
                    <>
                      <Separator className="my-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Organisation
                        </p>
                        <p className="text-xs font-medium text-blue-600">
                          {selectedTransaction.organisation_name}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Section Rapprochement */}
                  {selectedTransaction.reconciliation_link_count > 0 && (
                    <>
                      <Separator className="my-0.5" />
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-[10px] font-medium">
                          Rapprochement (
                          {selectedTransaction.reconciliation_link_count}{' '}
                          facture
                          {selectedTransaction.reconciliation_link_count > 1
                            ? 's'
                            : ''}
                          )
                        </p>

                        <div className="space-y-1">
                          {selectedTransaction.reconciliation_links.map(
                            link => (
                              <div
                                key={link.id}
                                className="p-1.5 bg-blue-50 border border-blue-100 rounded text-[10px]"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    {link.link_type === 'document' && (
                                      <FileText className="h-3 w-3 text-blue-500" />
                                    )}
                                    {link.link_type === 'sales_order' && (
                                      <Package className="h-3 w-3 text-blue-500" />
                                    )}
                                    {link.link_type === 'purchase_order' && (
                                      <Building2 className="h-3 w-3 text-orange-500" />
                                    )}
                                    <span className="font-semibold text-blue-800">
                                      {link.label}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] bg-blue-100 text-blue-700"
                                  >
                                    TVA {link.vat_rate}%
                                  </Badge>
                                </div>
                                {link.partner_name && (
                                  <p className="text-[9px] text-slate-500 mt-0.5">
                                    {link.partner_name}
                                  </p>
                                )}
                                <div className="flex justify-between mt-1 text-[10px]">
                                  <span className="text-slate-500">
                                    HT: {formatAmount(link.total_ht)}
                                  </span>
                                  <span className="text-slate-500">
                                    TVA:{' '}
                                    {formatAmount(
                                      link.total_ttc - link.total_ht
                                    )}
                                  </span>
                                  <span className="font-semibold">
                                    TTC: {formatAmount(link.total_ttc)}
                                  </span>
                                </div>
                                <div className="flex justify-between mt-0.5 pt-0.5 border-t border-blue-100">
                                  <span className="text-blue-600">Alloue</span>
                                  <span className="font-bold text-blue-700">
                                    {formatAmount(link.allocated_amount)}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* Total et reste */}
                        <div className="pt-1 space-y-0.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">
                              Total alloue
                            </span>
                            <span className="font-semibold">
                              {formatAmount(
                                selectedTransaction.reconciliation_total_allocated
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">
                              Montant transaction
                            </span>
                            <span className="font-medium">
                              {formatAmount(
                                Math.abs(selectedTransaction.amount)
                              )}
                            </span>
                          </div>
                          <Separator className="my-0.5" />
                          {selectedTransaction.reconciliation_remaining <=
                          0.01 ? (
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-green-700">
                                Entierement rapproche
                              </span>
                            </div>
                          ) : selectedTransaction.reconciliation_remaining <
                            -0.01 ? (
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-red-700">
                                Trop-percu
                              </span>
                              <span className="font-bold text-red-600">
                                {formatAmount(
                                  Math.abs(
                                    selectedTransaction.reconciliation_remaining
                                  )
                                )}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenRapprochementModal()}
                              className="flex justify-between items-center w-full text-xs p-1.5 -mx-1.5 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <span className="font-medium text-amber-700 underline underline-offset-2">
                                Reste a rapprocher
                              </span>
                              <span className="font-bold text-amber-600">
                                {formatAmount(
                                  selectedTransaction.reconciliation_remaining
                                )}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Section Pièces jointes */}
                  <TransactionAttachments
                    transaction={selectedTransaction}
                    onRefresh={onRefresh}
                    onOpenUploadModal={onOpenUploadModal}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <TransactionPanelActions
                transaction={selectedTransaction}
                isLockedByRule={isLockedByRule}
                onRefresh={onRefresh}
                onOpenClassificationModal={onOpenClassificationModal}
                onOpenOrganisationModal={onOpenOrganisationModal}
                onOpenRapprochementModal={onOpenRapprochementModal}
                onViewRule={onViewRule}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
