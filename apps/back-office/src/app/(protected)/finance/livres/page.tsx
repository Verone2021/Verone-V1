'use client';

/**
 * Page Livres Comptables - Conforme standard Abby/Pennylane
 *
 * 4 onglets :
 * 1. Résultats - Vue synthèse mensuelle avec détails expansibles
 * 2. Livre des recettes - Crédits (entrées d'argent)
 * 3. Livre des achats - Débits avec mode paiement et justificatif
 * 4. Compte de résultat - P&L format PCG complet
 */

import { useState, useMemo } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible';
import { useBankReconciliation, type BankTransaction } from '@verone/finance';
import {
  getPcgCategory,
  formatBankPaymentMethod,
  detectBankPaymentMethod,
} from '@verone/finance';
import { SupplierCellReadOnly } from '@verone/finance/components';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { Money, KpiCard, KpiGrid } from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
import {
  BookOpenCheck,
  TrendingUp,
  TrendingDown,
  Calculator,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Calendar,
  ChevronDown,
  ChevronRight,
  Paperclip,
  AlertTriangle,
  CreditCard,
  Info,
} from 'lucide-react';

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

function getMonthKey(dateStr: string | null): string {
  if (!dateStr) return 'unknown';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function hasAttachment(tx: BankTransaction): boolean {
  const rawData = tx.raw_data as { attachments?: unknown[] } | undefined;
  return Boolean(rawData?.attachments && rawData.attachments.length > 0);
}

function getPaymentMethod(tx: BankTransaction): string {
  // Try to detect from label
  const detected = detectBankPaymentMethod(tx.label ?? '');
  if (detected) return formatBankPaymentMethod(detected);

  // Try from raw_data
  const rawData = tx.raw_data as { operation_type?: string } | undefined;
  if (rawData?.operation_type) {
    const typeMap: Record<string, string> = {
      transfer: 'Virement',
      card: 'Carte bancaire',
      direct_debit: 'Prélèvement',
      check: 'Chèque',
    };
    return typeMap[rawData.operation_type] || rawData.operation_type;
  }

  return '-';
}

// =====================================================================
// COMPOSANT: TABLEAU LIVRE DES RECETTES
// =====================================================================

function RecettesTable({ transactions }: { transactions: BankTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Aucune recette pour cette période</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b uppercase tracking-wide">
        <div className="col-span-2">Date paiement</div>
        <div className="col-span-1">Réf.</div>
        <div className="col-span-3">Client / Libellé</div>
        <div className="col-span-2">Mode paiement</div>
        <div className="col-span-1 text-right">HT</div>
        <div className="col-span-1 text-right">TVA</div>
        <div className="col-span-2 text-right">TTC</div>
      </div>
      <ScrollArea className="h-[400px]">
        {transactions.map(tx => {
          const vatRate = (tx as any).vat_rate || 20;
          const ttc = Math.abs(tx.amount);
          const ht = Math.round((ttc / (1 + vatRate / 100)) * 100) / 100;
          const tva = ttc - ht;

          return (
            <div
              key={tx.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b hover:bg-muted/30 transition-colors items-center"
            >
              <div className="col-span-2 text-sm text-muted-foreground">
                {formatDate(tx.settled_at ?? tx.emitted_at)}
              </div>
              <div className="col-span-1 text-xs text-muted-foreground">
                {tx.reference ?? '-'}
              </div>
              <div className="col-span-3">
                <div className="font-medium truncate text-sm">
                  <SupplierCellReadOnly
                    counterpartyName={tx.counterparty_name}
                    label={tx.label}
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {tx.label}
                </p>
              </div>
              <div className="col-span-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <CreditCard className="h-3 w-3" />
                  {getPaymentMethod(tx)}
                </Badge>
              </div>
              <div className="col-span-1 text-right text-sm">
                <Money amount={ht} size="sm" />
              </div>
              <div className="col-span-1 text-right text-sm text-muted-foreground">
                <Money amount={tva} size="sm" />
              </div>
              <div className="col-span-2 text-right">
                <Money amount={ttc} className="text-green-600 font-semibold" />
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}

// =====================================================================
// COMPOSANT: TABLEAU LIVRE DES ACHATS
// =====================================================================

function AchatsTable({ transactions }: { transactions: BankTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Aucun achat pour cette période</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b uppercase tracking-wide">
        <div className="col-span-1">Date</div>
        <div className="col-span-3">Fournisseur / Libellé</div>
        <div className="col-span-2">Catégorie PCG</div>
        <div className="col-span-1">Paiement</div>
        <div className="col-span-1 text-right">HT</div>
        <div className="col-span-1 text-right">TVA</div>
        <div className="col-span-2 text-right">TTC</div>
        <div className="col-span-1 text-center">Just.</div>
      </div>
      <ScrollArea className="h-[400px]">
        {transactions.map(tx => {
          const pcgCode =
            (tx as any).category_pcg ||
            (tx as any).ignore_reason?.match(/PCG (\d+)/)?.[1];
          const pcgInfo = pcgCode ? getPcgCategory(pcgCode) : null;
          const vatRate = (tx as any).vat_rate || 20;
          const ttc = Math.abs(tx.amount);
          const ht = Math.round((ttc / (1 + vatRate / 100)) * 100) / 100;
          const tva = ttc - ht;
          const hasJustificatif = hasAttachment(tx);

          return (
            <div
              key={tx.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b hover:bg-muted/30 transition-colors items-center"
            >
              <div className="col-span-1 text-xs text-muted-foreground">
                {formatDate(tx.settled_at ?? tx.emitted_at)}
              </div>
              <div className="col-span-3">
                <div className="font-medium truncate text-sm">
                  <SupplierCellReadOnly
                    counterpartyName={tx.counterparty_name}
                    label={tx.label}
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {tx.label}
                </p>
              </div>
              <div className="col-span-2">
                {pcgInfo ? (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {pcgInfo.code} - {pcgInfo.label}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Non classé
                  </span>
                )}
              </div>
              <div className="col-span-1">
                <span className="text-xs">{getPaymentMethod(tx)}</span>
              </div>
              <div className="col-span-1 text-right text-sm">
                <Money amount={-ht} size="sm" />
              </div>
              <div className="col-span-1 text-right text-sm text-muted-foreground">
                <Money amount={tva} size="sm" />
              </div>
              <div className="col-span-2 text-right">
                <Money amount={-ttc} className="text-red-600 font-semibold" />
              </div>
              <div className="col-span-1 text-center">
                {hasJustificatif ? (
                  <Paperclip className="h-4 w-4 text-green-600 mx-auto" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                )}
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}

// =====================================================================
// COMPOSANT: ONGLET RÉSULTATS (Synthèse mensuelle avec expansion)
// =====================================================================

function ResultatsTab({
  creditTransactions,
  debitTransactions,
  selectedYear,
}: {
  creditTransactions: BankTransaction[];
  debitTransactions: BankTransaction[];
  selectedYear: string;
}) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Grouper par mois avec transactions détaillées
  const monthlyData = useMemo(() => {
    const months: Record<
      string,
      {
        credits: number;
        debits: number;
        creditTx: BankTransaction[];
        debitTx: BankTransaction[];
      }
    > = {};

    creditTransactions.forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date?.startsWith(selectedYear)) return;
      const key = getMonthKey(date);
      if (!months[key])
        months[key] = { credits: 0, debits: 0, creditTx: [], debitTx: [] };
      months[key].credits += Math.abs(tx.amount);
      months[key].creditTx.push(tx);
    });

    debitTransactions.forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date?.startsWith(selectedYear)) return;
      const key = getMonthKey(date);
      if (!months[key])
        months[key] = { credits: 0, debits: 0, creditTx: [], debitTx: [] };
      months[key].debits += Math.abs(tx.amount);
      months[key].debitTx.push(tx);
    });

    return Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({
        month,
        label: formatMonth(`${month}-01`),
        ...data,
        solde: data.credits - data.debits,
      }));
  }, [creditTransactions, debitTransactions, selectedYear]);

  // Totaux
  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        credits: acc.credits + m.credits,
        debits: acc.debits + m.debits,
        solde: acc.solde + m.solde,
      }),
      { credits: 0, debits: 0, solde: 0 }
    );
  }, [monthlyData]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* KPIs annuels */}
      <KpiGrid columns={3}>
        <KpiCard
          title="Total Recettes"
          value={totals.credits}
          valueType="money"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          title="Total Achats"
          value={totals.debits}
          valueType="money"
          icon={<TrendingDown className="h-4 w-4" />}
          color="danger"
        />
        <KpiCard
          title="Résultat"
          value={totals.solde}
          valueType="money"
          icon={<Calculator className="h-4 w-4" />}
          variant={totals.solde >= 0 ? 'success' : 'danger'}
        />
      </KpiGrid>

      {/* Tableau mensuel avec expansion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Synthèse mensuelle {selectedYear}
          </CardTitle>
          <CardDescription>
            Cliquez sur un mois pour voir le détail des transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
              <div />
              <div>Mois</div>
              <div className="text-right">Recettes</div>
              <div className="text-right">Achats</div>
              <div className="text-right">Solde</div>
            </div>

            {monthlyData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune donnée pour {selectedYear}
              </div>
            ) : (
              monthlyData.map(row => (
                <Collapsible
                  key={row.month}
                  open={expandedMonths.has(row.month)}
                  onOpenChange={() => toggleMonth(row.month)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b hover:bg-muted/30 cursor-pointer transition-colors">
                      <div className="flex items-center">
                        {expandedMonths.has(row.month) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="font-medium capitalize text-left">
                        {row.label}
                      </div>
                      <div className="text-right">
                        <Money
                          amount={row.credits}
                          className="text-green-600"
                        />
                      </div>
                      <div className="text-right">
                        <Money amount={-row.debits} className="text-red-600" />
                      </div>
                      <div className="text-right">
                        <Money amount={row.solde} colorize bold />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-muted/20 px-8 py-4 border-b space-y-4">
                      {/* Recettes du mois */}
                      {row.creditTx.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                            <ArrowDownLeft className="h-4 w-4" />
                            Recettes ({row.creditTx.length})
                          </h4>
                          <div className="space-y-1">
                            {row.creditTx.slice(0, 5).map(tx => (
                              <div
                                key={tx.id}
                                className="flex justify-between text-sm py-1 px-2 bg-white rounded"
                              >
                                <span className="text-muted-foreground">
                                  {formatDate(tx.settled_at ?? tx.emitted_at)} -{' '}
                                  {tx.counterparty_name || tx.label}
                                </span>
                                <Money
                                  amount={Math.abs(tx.amount)}
                                  className="text-green-600"
                                  size="sm"
                                />
                              </div>
                            ))}
                            {row.creditTx.length > 5 && (
                              <p className="text-xs text-muted-foreground italic">
                                + {row.creditTx.length - 5} autre(s)
                                transaction(s)
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dépenses du mois */}
                      {row.debitTx.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4" />
                            Dépenses ({row.debitTx.length})
                          </h4>
                          <div className="space-y-1">
                            {row.debitTx.slice(0, 5).map(tx => (
                              <div
                                key={tx.id}
                                className="flex justify-between text-sm py-1 px-2 bg-white rounded"
                              >
                                <span className="text-muted-foreground">
                                  {formatDate(tx.settled_at ?? tx.emitted_at)} -{' '}
                                  {tx.counterparty_name || tx.label}
                                </span>
                                <Money
                                  amount={-Math.abs(tx.amount)}
                                  className="text-red-600"
                                  size="sm"
                                />
                              </div>
                            ))}
                            {row.debitTx.length > 5 && (
                              <p className="text-xs text-muted-foreground italic">
                                + {row.debitTx.length - 5} autre(s)
                                transaction(s)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}

            {/* Total */}
            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted font-bold">
              <div />
              <div>TOTAL {selectedYear}</div>
              <div className="text-right">
                <Money amount={totals.credits} className="text-green-600" />
              </div>
              <div className="text-right">
                <Money amount={-totals.debits} className="text-red-600" />
              </div>
              <div className="text-right">
                <Money amount={totals.solde} colorize />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// COMPOSANT: ONGLET COMPTE DE RÉSULTAT (P&L PCG Complet)
// =====================================================================

function CompteResultatTab({
  creditTransactions,
  debitTransactions,
  selectedYear,
}: {
  creditTransactions: BankTransaction[];
  debitTransactions: BankTransaction[];
  selectedYear: string;
}) {
  // Structure PCG complète
  const pcgStructure = {
    produits: [
      { code: '70', label: 'Ventes de produits/services' },
      { code: '74', label: 'Subventions' },
      { code: '75', label: 'Autres produits de gestion' },
      { code: '76', label: 'Produits financiers' },
      { code: '77', label: 'Produits exceptionnels' },
    ],
    charges: [
      { code: '60', label: 'Achats (marchandises, matières)' },
      { code: '61', label: 'Services extérieurs' },
      { code: '62', label: 'Autres services extérieurs' },
      { code: '63', label: 'Impôts et taxes' },
      { code: '64', label: 'Charges de personnel' },
      { code: '65', label: 'Autres charges de gestion' },
      { code: '66', label: 'Charges financières' },
      { code: '67', label: 'Charges exceptionnelles' },
      { code: '68', label: 'Dotations aux amortissements' },
      { code: '69', label: 'Impôt sur les bénéfices' },
    ],
  };

  // Calculer les produits par classe
  const produitsParClasse = useMemo(() => {
    const classes: Record<string, number> = {};
    pcgStructure.produits.forEach(p => (classes[p.code] = 0));

    creditTransactions.forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date?.startsWith(selectedYear)) return;

      const pcgCode = (tx as any).category_pcg;
      if (pcgCode) {
        const classCode = pcgCode.substring(0, 2);
        if (classes[classCode] !== undefined) {
          classes[classCode] += Math.abs(tx.amount);
        }
      } else {
        // Par défaut, classer en ventes (70)
        classes['70'] += Math.abs(tx.amount);
      }
    });

    return pcgStructure.produits
      .map(p => ({
        ...p,
        total: classes[p.code] ?? 0,
      }))
      .filter(p => p.total > 0);
  }, [creditTransactions, selectedYear]);

  // Calculer les charges par classe
  const chargesParClasse = useMemo(() => {
    const classes: Record<string, number> = {};
    pcgStructure.charges.forEach(c => (classes[c.code] = 0));

    debitTransactions.forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date?.startsWith(selectedYear)) return;

      const pcgCode =
        (tx as any).category_pcg ||
        (tx as any).ignore_reason?.match(/PCG (\d+)/)?.[1];
      if (pcgCode) {
        const classCode = pcgCode.substring(0, 2);
        if (classes[classCode] !== undefined) {
          classes[classCode] += Math.abs(tx.amount);
        }
      } else {
        // Par défaut, classer les dépenses non catégorisées en Achats (60)
        classes['60'] += Math.abs(tx.amount);
      }
    });

    return pcgStructure.charges
      .map(c => ({
        ...c,
        total: classes[c.code] ?? 0,
      }))
      .filter(c => c.total > 0);
  }, [debitTransactions, selectedYear]);

  // Totaux
  const totalProduits = produitsParClasse.reduce((sum, p) => sum + p.total, 0);
  const totalCharges = chargesParClasse.reduce((sum, c) => sum + c.total, 0);
  const resultat = totalProduits - totalCharges;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Compte de Résultat {selectedYear}
          </CardTitle>
          <CardDescription>
            Format Plan Comptable Général (PCG) - Classes 6 et 7
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* PRODUITS (Classe 7) */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-green-700 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              PRODUITS (Classe 7)
            </h3>
            <div className="border rounded-lg overflow-hidden">
              {produitsParClasse.length === 0 ? (
                <div className="px-4 py-4 text-muted-foreground text-center">
                  Aucun produit enregistré
                </div>
              ) : (
                produitsParClasse.map(produit => (
                  <div
                    key={produit.code}
                    className="flex justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <span className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="font-mono bg-green-50 text-green-700"
                      >
                        {produit.code}
                      </Badge>
                      {produit.label}
                    </span>
                    <Money
                      amount={produit.total}
                      className="text-green-600 font-medium"
                    />
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between px-4 py-3 font-bold text-green-700 border-t-2 border-green-300 mt-2 bg-green-50 rounded">
              <span>TOTAL PRODUITS</span>
              <Money amount={totalProduits} />
            </div>
          </div>

          {/* CHARGES (Classe 6) */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-red-700 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              CHARGES (Classe 6)
            </h3>
            <div className="border rounded-lg overflow-hidden">
              {chargesParClasse.length === 0 ? (
                <div className="px-4 py-4 text-muted-foreground text-center">
                  Aucune charge catégorisée
                </div>
              ) : (
                chargesParClasse.map(charge => (
                  <div
                    key={charge.code}
                    className="flex justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <span className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="font-mono bg-red-50 text-red-700"
                      >
                        {charge.code}
                      </Badge>
                      {charge.label}
                    </span>
                    <Money
                      amount={-charge.total}
                      className="text-red-600 font-medium"
                    />
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between px-4 py-3 font-bold text-red-700 border-t-2 border-red-300 mt-2 bg-red-50 rounded">
              <span>TOTAL CHARGES</span>
              <Money amount={-totalCharges} />
            </div>
          </div>

          {/* RÉSULTAT NET */}
          <div
            className={`p-6 rounded-lg ${resultat >= 0 ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xl font-bold">RÉSULTAT NET</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {resultat >= 0 ? 'Bénéfice' : 'Perte'} de l'exercice{' '}
                  {selectedYear}
                </p>
              </div>
              <Money
                amount={resultat}
                className={`text-3xl font-bold ${resultat >= 0 ? 'text-green-700' : 'text-red-700'}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// PAGE PRINCIPALE
// =====================================================================

export default function LivresComptablesPage() {
  const [activeTab, setActiveTab] = useState('resultats');
  const [selectedYear, setSelectedYear] = useState('2025');

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  // Filtrer par année sélectionnée
  const filteredCredits = useMemo(() => {
    return creditTransactions.filter(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      return date?.startsWith(selectedYear);
    });
  }, [creditTransactions, selectedYear]);

  const filteredDebits = useMemo(() => {
    return debitTransactions.filter(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      return date?.startsWith(selectedYear);
    });
  }, [debitTransactions, selectedYear]);

  // FEATURE FLAG
  if (!featureFlags.financeEnabled) {
    return (
      <div className="w-full py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Livres Comptables - Phase 2
                </CardTitle>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpenCheck className="h-6 w-6" />
            Livres Comptables
          </h1>
          <p className="text-muted-foreground">
            Registres comptables conformes au PCG
          </p>
        </div>

        {/* Sélecteur d'année */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resultats" className="gap-2">
            <Calculator className="h-4 w-4" />
            Résultats
          </TabsTrigger>
          <TabsTrigger value="recettes" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Livre des recettes
          </TabsTrigger>
          <TabsTrigger value="achats" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Livre des achats
          </TabsTrigger>
          <TabsTrigger value="compte-resultat" className="gap-2">
            <BookOpenCheck className="h-4 w-4" />
            Compte de résultat
          </TabsTrigger>
        </TabsList>

        {/* Contenu des tabs */}
        {loading ? (
          <Card className="mt-6">
            <CardContent className="py-12">
              <div className="flex items-center justify-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-muted-foreground">Chargement...</span>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="py-6 text-red-700">{error}</CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="resultats" className="mt-6">
              <ResultatsTab
                creditTransactions={creditTransactions}
                debitTransactions={debitTransactions}
                selectedYear={selectedYear}
              />
            </TabsContent>

            <TabsContent value="recettes" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Livre des recettes - {selectedYear}
                      </CardTitle>
                      <CardDescription>
                        Entrées de trésorerie (ventes, encaissements)
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      {filteredCredits.length} entrées
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bandeau d'information */}
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 text-sm">
                      <strong>Source temporaire :</strong> Transactions
                      bancaires crédit. Les factures clients seront disponibles
                      à partir de janvier 2026.
                    </AlertDescription>
                  </Alert>

                  <RecettesTable transactions={filteredCredits} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achats" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        Livre des achats - {selectedYear}
                      </CardTitle>
                      <CardDescription>
                        Sorties de trésorerie catégorisées par PCG
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">
                      {filteredDebits.length} sorties
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <AchatsTable transactions={filteredDebits} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compte-resultat" className="mt-6">
              <CompteResultatTab
                creditTransactions={creditTransactions}
                debitTransactions={debitTransactions}
                selectedYear={selectedYear}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
