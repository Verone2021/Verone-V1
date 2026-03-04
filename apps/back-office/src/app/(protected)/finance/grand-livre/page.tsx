'use client';

/**
 * Grand Livre Comptable
 *
 * Vue par compte PCG avec liste des écritures et soldes.
 * Conforme aux obligations comptables SASU/SAS (Code de Commerce Art. L123-12).
 *
 * Structure:
 * - Filtre année + recherche compte
 * - Liste des comptes PCG utilisés avec solde
 * - Détail des écritures pour chaque compte (expansible)
 */

import { useState, useMemo } from 'react';

import {
  useBankReconciliation,
  ALL_PCG_CATEGORIES,
  getPcgCategory,
  type BankTransaction,
} from '@verone/finance';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea,
  Button,
} from '@verone/ui';
import { KpiCard, KpiGrid, Money } from '@verone/ui-business';
import {
  BookOpenCheck,
  Calendar,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  TrendingUp,
  TrendingDown,
  Calculator,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface AccountEntry {
  id: string;
  date: string;
  label: string;
  counterparty: string;
  debit: number;
  credit: number;
  reference: string;
}

interface AccountSummary {
  code: string;
  label: string;
  entries: AccountEntry[];
  totalDebit: number;
  totalCredit: number;
  solde: number; // debit - credit
}

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// =====================================================================
// PAGE
// =====================================================================

export default function GrandLivrePage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [searchAccount, setSearchAccount] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set()
  );

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  // Build account data from transactions
  const accounts = useMemo(() => {
    const accountMap = new Map<string, AccountSummary>();

    const processTransaction = (tx: BankTransaction, isCredit: boolean) => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;

      // Get PCG code
      const rawCode = (tx as BankTransaction & { category_pcg?: string })
        .category_pcg;
      const pcgCode = rawCode ?? '00';
      const pcgInfo =
        pcgCode === '00' ? null : getPcgCategory(pcgCode.substring(0, 2));

      const accountCode = pcgCode;
      const accountLabel =
        pcgCode === '00'
          ? 'Non categorise'
          : (pcgInfo?.label ?? 'Compte inconnu');

      if (!accountMap.has(accountCode)) {
        accountMap.set(accountCode, {
          code: accountCode,
          label: accountLabel,
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
          solde: 0,
        });
      }

      const account = accountMap.get(accountCode)!;
      const amount = Math.abs(tx.amount);

      account.entries.push({
        id: tx.id,
        date,
        label: tx.label ?? 'Transaction',
        counterparty: tx.counterparty_name ?? '-',
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        reference: tx.reference ?? '-',
      });

      if (isCredit) {
        account.totalCredit += amount;
      } else {
        account.totalDebit += amount;
      }
      account.solde = account.totalDebit - account.totalCredit;

      // Also add bank counterpart (512)
      const bankCode = '512';
      const bankLabel = 'Banque';

      if (!accountMap.has(bankCode)) {
        accountMap.set(bankCode, {
          code: bankCode,
          label: bankLabel,
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
          solde: 0,
        });
      }

      const bankAccount = accountMap.get(bankCode)!;
      bankAccount.entries.push({
        id: `${tx.id}-bank`,
        date,
        label: tx.label ?? 'Transaction',
        counterparty: tx.counterparty_name ?? '-',
        debit: isCredit ? amount : 0,
        credit: isCredit ? 0 : amount,
        reference: tx.reference ?? '-',
      });

      if (isCredit) {
        bankAccount.totalDebit += amount;
      } else {
        bankAccount.totalCredit += amount;
      }
      bankAccount.solde = bankAccount.totalDebit - bankAccount.totalCredit;
    };

    creditTransactions.forEach(tx => processTransaction(tx, true));
    debitTransactions.forEach(tx => processTransaction(tx, false));

    // Sort entries by date within each account
    for (const account of accountMap.values()) {
      account.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    return Array.from(accountMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }, [creditTransactions, debitTransactions, selectedYear]);

  // Filter by search
  const filteredAccounts = useMemo(() => {
    if (!searchAccount) return accounts;
    const q = searchAccount.toLowerCase();
    return accounts.filter(
      a => a.code.includes(q) || a.label.toLowerCase().includes(q)
    );
  }, [accounts, searchAccount]);

  // Totals
  const totals = useMemo(() => {
    return filteredAccounts.reduce(
      (acc, a) => ({
        debit: acc.debit + a.totalDebit,
        credit: acc.credit + a.totalCredit,
        accounts: acc.accounts + 1,
        entries: acc.entries + a.entries.length,
      }),
      { debit: 0, credit: 0, accounts: 0, entries: 0 }
    );
  }, [filteredAccounts]);

  const toggleAccount = (code: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Years array
  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
  );

  // Export FEC handler
  const handleExportFec = () => {
    if (selectedYear === 'all') return;
    window.open(`/api/finance/export-fec?year=${selectedYear}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpenCheck className="h-6 w-6" />
            Grand Livre
          </h1>
          <p className="text-muted-foreground">
            Écritures ventilées par compte PCG — Obligation légale SASU
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportFec}
            disabled={selectedYear === 'all'}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export FEC {selectedYear !== 'all' ? selectedYear : ''}
          </Button>
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid columns={4}>
        <KpiCard
          title="Comptes utilisés"
          value={totals.accounts}
          valueType="number"
          icon={<BookOpenCheck className="h-4 w-4" />}
        />
        <KpiCard
          title="Total écritures"
          value={totals.entries}
          valueType="number"
          icon={<Calculator className="h-4 w-4" />}
        />
        <KpiCard
          title="Total débit"
          value={totals.debit}
          valueType="money"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KpiCard
          title="Total crédit"
          value={totals.credit}
          valueType="money"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
      </KpiGrid>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un compte (code ou libellé)..."
          value={searchAccount}
          onChange={e => setSearchAccount(e.target.value)}
          className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full"
        />
      </div>

      {/* Accounts list */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Chargement...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-red-700">{error}</CardContent>
        </Card>
      ) : filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpenCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Aucun compte avec des écritures pour cette période</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Comptes PCG —{' '}
              {selectedYear === 'all' ? 'Toutes les années' : selectedYear}
            </CardTitle>
            <CardDescription>
              {filteredAccounts.length} comptes actifs — Cliquez pour voir le
              détail
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b uppercase tracking-wide">
              <div className="col-span-1" />
              <div className="col-span-2">Compte</div>
              <div className="col-span-4">Libellé</div>
              <div className="col-span-1 text-center">Écr.</div>
              <div className="col-span-2 text-right">Débit</div>
              <div className="col-span-2 text-right">Crédit</div>
            </div>

            <ScrollArea className="h-[600px]">
              {filteredAccounts.map(account => (
                <div key={account.code}>
                  {/* Account row */}
                  <button
                    onClick={() => toggleAccount(account.code)}
                    className="w-full grid grid-cols-12 gap-2 px-4 py-3 border-b hover:bg-muted/30 transition-colors items-center text-left"
                  >
                    <div className="col-span-1">
                      {expandedAccounts.has(account.code) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {account.code}
                      </Badge>
                    </div>
                    <div className="col-span-4 font-medium text-sm">
                      {account.label}
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="secondary" className="text-xs">
                        {account.entries.length}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-right">
                      <Money
                        amount={account.totalDebit}
                        className="text-red-600"
                        size="sm"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <Money
                        amount={account.totalCredit}
                        className="text-green-600"
                        size="sm"
                      />
                    </div>
                  </button>

                  {/* Entries (expanded) */}
                  {expandedAccounts.has(account.code) && (
                    <div className="bg-muted/10 border-b">
                      <div className="grid grid-cols-12 gap-2 px-8 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/20">
                        <div className="col-span-2">Date</div>
                        <div className="col-span-4">Libellé</div>
                        <div className="col-span-2">Contrepartie</div>
                        <div className="col-span-2 text-right">Débit</div>
                        <div className="col-span-2 text-right">Crédit</div>
                      </div>
                      {account.entries.slice(0, 50).map(entry => (
                        <div
                          key={entry.id}
                          className="grid grid-cols-12 gap-2 px-8 py-2 text-sm border-b border-muted/30 hover:bg-white/50"
                        >
                          <div className="col-span-2 text-muted-foreground">
                            {formatDate(entry.date)}
                          </div>
                          <div className="col-span-4 truncate">
                            {entry.label}
                          </div>
                          <div className="col-span-2 text-muted-foreground truncate">
                            {entry.counterparty}
                          </div>
                          <div className="col-span-2 text-right">
                            {entry.debit > 0 ? (
                              <Money
                                amount={entry.debit}
                                className="text-red-600"
                                size="sm"
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            {entry.credit > 0 ? (
                              <Money
                                amount={entry.credit}
                                className="text-green-600"
                                size="sm"
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {account.entries.length > 50 && (
                        <div className="px-8 py-2 text-xs text-muted-foreground italic">
                          + {account.entries.length - 50} écritures
                          supplémentaires
                        </div>
                      )}
                      {/* Account total */}
                      <div className="grid grid-cols-12 gap-2 px-8 py-2 bg-muted/30 font-bold text-sm">
                        <div className="col-span-8">
                          Solde compte {account.code}
                        </div>
                        <div className="col-span-2 text-right">
                          <Money
                            amount={account.totalDebit}
                            className="text-red-700"
                            size="sm"
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <Money
                            amount={account.totalCredit}
                            className="text-green-700"
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>

            {/* Grand total */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted font-bold border-t-2">
              <div className="col-span-1" />
              <div className="col-span-6">TOTAL GRAND LIVRE</div>
              <div className="col-span-1" />
              <div className="col-span-2 text-right">
                <Money amount={totals.debit} className="text-red-700" />
              </div>
              <div className="col-span-2 text-right">
                <Money amount={totals.credit} className="text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
