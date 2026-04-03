'use client';

import { getPcgColor, getPcgCategory } from '@verone/finance';
import type { UnifiedTransaction } from '@verone/finance/hooks';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Calendar,
  FileText,
  Paperclip,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { formatAmount, getPaymentMethodDisplay } from './transaction-helpers';

interface GroupedMonth {
  month: string;
  label: string;
  txs: UnifiedTransaction[];
}

interface TransactionListProps {
  isLoading: boolean;
  transactions: UnifiedTransaction[];
  groupedByMonth: GroupedMonth[];
  selectedTransactionId: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setPageSize: (size: 10 | 20) => void;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  onSelectTransaction: (tx: UnifiedTransaction) => void;
  onOpenClassificationModal: (tx: UnifiedTransaction) => void;
}

export function TransactionList({
  isLoading,
  transactions,
  groupedByMonth,
  selectedTransactionId,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  setPageSize,
  nextPage,
  prevPage,
  onSelectTransaction,
  onOpenClassificationModal,
}: TransactionListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-16 border-b animate-pulse bg-muted/30"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Aucune transaction trouvee</p>
          </div>
        ) : (
          <div>
            {groupedByMonth.map(group => (
              <div key={group.month}>
                {/* Separateur mensuel */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold capitalize">
                    {group.label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {group.txs.length}
                  </Badge>
                </div>

                {/* Transactions du mois */}
                {group.txs.map(tx => (
                  <div
                    key={tx.id}
                    data-testid={`tx-row-${tx.id}`}
                    onClick={() => onSelectTransaction(tx)}
                    className={`
                      flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-colors
                      ${selectedTransactionId === tx.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'}
                      ${tx.unified_status === 'ignored' ? 'opacity-50' : ''}
                    `}
                  >
                    {/* Date empilee */}
                    <div className="w-12 text-center flex-shrink-0">
                      <p className="text-sm font-semibold leading-tight">
                        {new Date(
                          tx.settled_at ?? tx.emitted_at ?? ''
                        ).toLocaleDateString('fr-FR', { day: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {new Date(
                          tx.settled_at ?? tx.emitted_at ?? ''
                        ).toLocaleDateString('fr-FR', { month: 'short' })}
                      </p>
                    </div>

                    {/* Icone justificatif */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {(tx.attachment_ids?.length ?? 0) > 0 ? (
                        <div className="relative">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                      ) : (
                        <Paperclip className="h-4 w-4 text-muted-foreground/30" />
                      )}
                      {tx.justification_optional && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 text-amber-600 border-amber-300"
                        >
                          Facultatif
                        </Badge>
                      )}
                    </div>

                    {/* Nom contrepartie */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {tx.counterparty_name ?? tx.label ?? 'Sans libelle'}
                      </p>
                      {tx.organisation_name && (
                        <p className="text-xs text-blue-600 truncate">
                          {tx.organisation_name}
                        </p>
                      )}
                    </div>

                    {/* Mode de paiement */}
                    <div className="w-24 flex-shrink-0">
                      {(() => {
                        const pmDisplay = getPaymentMethodDisplay(tx);
                        if (!pmDisplay)
                          return (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          );
                        return (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-slate-200 text-slate-600"
                          >
                            {pmDisplay.label}
                          </Badge>
                        );
                      })()}
                    </div>

                    {/* Categorie */}
                    <div className="w-44 flex-shrink-0">
                      {tx.category_pcg ? (
                        <Badge
                          variant="secondary"
                          className="text-xs gap-1 max-w-full truncate"
                          style={{
                            backgroundColor: `${getPcgColor(tx.category_pcg)}15`,
                            color: getPcgColor(tx.category_pcg),
                            borderColor: `${getPcgColor(tx.category_pcg)}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: getPcgColor(tx.category_pcg),
                            }}
                          />
                          {getPcgCategory(tx.category_pcg)?.label ??
                            tx.category_pcg}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs border-orange-300 bg-orange-50 text-orange-700 cursor-pointer hover:bg-orange-100"
                          onClick={e => {
                            e.stopPropagation();
                            onOpenClassificationModal(tx);
                          }}
                        >
                          A categoriser
                        </Badge>
                      )}
                    </div>

                    {/* TVA */}
                    <div className="w-24 flex-shrink-0">
                      {tx.reconciliation_vat_rates.length > 0 ? (
                        <div className="flex flex-wrap gap-0.5">
                          {tx.reconciliation_vat_rates.map(rate => (
                            <Badge
                              key={rate}
                              variant="secondary"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              TVA {rate}%
                            </Badge>
                          ))}
                        </div>
                      ) : tx.vat_rate != null ? (
                        <Badge variant="secondary" className="text-xs">
                          TVA {tx.vat_rate}%
                        </Badge>
                      ) : tx.vat_breakdown && tx.vat_breakdown.length > 0 ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-50 text-green-700"
                        >
                          TVA OCR
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Rapprochement */}
                    <div className="w-32 flex-shrink-0">
                      {tx.reconciliation_link_count > 0 ? (
                        <div>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              tx.reconciliation_remaining <= 0.01
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {(() => {
                              const links = tx.reconciliation_links ?? [];
                              const invoiceCount = links.filter(
                                l => l.link_type === 'document'
                              ).length;
                              const orderCount = links.length - invoiceCount;
                              if (invoiceCount > 0 && orderCount > 0)
                                return `${invoiceCount} fact. + ${orderCount} cmd`;
                              if (invoiceCount > 0)
                                return `${invoiceCount} facture${invoiceCount > 1 ? 's' : ''}`;
                              return `${orderCount} commande${orderCount > 1 ? 's' : ''}`;
                            })()}
                          </Badge>
                          {tx.reconciliation_remaining > 0.01 && (
                            <p className="text-[10px] text-amber-600 mt-0.5">
                              Reste {formatAmount(tx.reconciliation_remaining)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Montant */}
                    <div className="w-28 text-right flex-shrink-0">
                      <span
                        className={`font-semibold ${tx.side === 'credit' ? 'text-green-600' : ''}`}
                      >
                        {tx.side === 'credit' ? '+' : ''}
                        {formatAmount(
                          tx.side === 'credit'
                            ? Math.abs(tx.amount)
                            : -Math.abs(tx.amount)
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && transactions.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Afficher</span>
              <Select
                value={String(pageSize)}
                onValueChange={v => setPageSize(Number(v) as 10 | 20)}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">par page</span>
            </div>

            <span className="text-sm text-muted-foreground">
              {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalCount)} sur {totalCount}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void prevPage()}
                disabled={currentPage <= 1 || isLoading}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Precedent
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void nextPage()}
                disabled={currentPage >= totalPages || isLoading}
                className="gap-1"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
