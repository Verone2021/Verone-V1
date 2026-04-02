'use client';

/**
 * Grand Livre Comptable — Style Indy
 *
 * Vue par compte PCG avec liste des ecritures et soldes.
 * Design epure : pas de KPIs, pas de recherche, alerte exercice.
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  useBankReconciliation,
  getPcgCategory,
  type BankTransaction,
} from '@verone/finance';
import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import {
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  Info,
  ArrowLeft,
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
}

interface AccountSummary {
  code: string;
  label: string;
  entries: AccountEntry[];
  totalDebit: number;
  totalCredit: number;
  solde: number;
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
      });

      if (isCredit) {
        account.totalCredit += amount;
      } else {
        account.totalDebit += amount;
      }
      account.solde = account.totalDebit - account.totalCredit;

      // Bank counterpart (512)
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

  // Totals
  const totals = useMemo(() => {
    return accounts.reduce(
      (acc, a) => ({
        debit: acc.debit + a.totalDebit,
        credit: acc.credit + a.totalCredit,
      }),
      { debit: 0, credit: 0 }
    );
  }, [accounts]);

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

  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href="/finance/documents"
              className="hover:text-black transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Documents
            </Link>
            <span>/</span>
            <span className="text-black">Grand Livre</span>
          </div>
          <h1 className="text-2xl font-bold">Grand Livre</h1>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-44 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les annees</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                Exercice {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Guide */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Le Grand Livre</strong> liste tous les comptes comptables avec
          leurs mouvements. Chaque compte a un numero PCG (ex: 512 = Banque, 607
          = Achats). Cliquez sur un compte pour voir le detail des ecritures.
          Les comptes &quot;Non categorise&quot; doivent etre rapproches avant
          la cloture.
        </AlertDescription>
      </Alert>

      {/* Alert exercice */}
      {selectedYear !== 'all' && (
        <Alert className="border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 text-sm">
            Votre exercice {selectedYear} va du 1er janv. {selectedYear} au 31
            dec. {selectedYear}.
          </AlertDescription>
        </Alert>
      )}

      {/* Accounts table */}
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
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpenCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Aucun compte avec des ecritures pour cette periode</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-xl bg-white overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-1" />
            <div className="col-span-5">Code + Libelle</div>
            <div className="col-span-2 text-right">Solde</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
          </div>

          {accounts.map(account => (
            <div key={account.code}>
              {/* Account row */}
              <button
                onClick={() => toggleAccount(account.code)}
                className="w-full grid grid-cols-12 gap-2 px-5 py-3.5 border-b hover:bg-gray-50 transition-colors items-center text-left"
              >
                <div className="col-span-1">
                  {expandedAccounts.has(account.code) ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="col-span-5 text-sm">
                  <span className="font-mono text-muted-foreground mr-2">
                    {account.code}
                  </span>
                  <span className="font-medium">{account.label}</span>
                </div>
                <div className="col-span-2 text-right">
                  <Money amount={account.solde} size="sm" colorize />
                </div>
                <div className="col-span-2 text-right">
                  <Money amount={account.totalDebit} size="sm" />
                </div>
                <div className="col-span-2 text-right">
                  <Money amount={account.totalCredit} size="sm" />
                </div>
              </button>

              {/* Entries (expanded) */}
              {expandedAccounts.has(account.code) && (
                <div className="bg-gray-50/50 border-b">
                  <div className="grid grid-cols-12 gap-2 px-8 py-2 text-xs font-medium text-muted-foreground border-b">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-4">Libelle</div>
                    <div className="col-span-2">Contrepartie</div>
                    <div className="col-span-2 text-right">Debit</div>
                    <div className="col-span-2 text-right">Credit</div>
                  </div>
                  {account.entries.slice(0, 50).map(entry => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-12 gap-2 px-8 py-2 text-sm border-b border-gray-100 hover:bg-white/50"
                    >
                      <div className="col-span-2 text-muted-foreground">
                        {formatDate(entry.date)}
                      </div>
                      <div className="col-span-4 truncate">{entry.label}</div>
                      <div className="col-span-2 text-muted-foreground truncate">
                        {entry.counterparty}
                      </div>
                      <div className="col-span-2 text-right">
                        {entry.debit > 0 ? (
                          <Money amount={entry.debit} size="sm" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="col-span-2 text-right">
                        {entry.credit > 0 ? (
                          <Money amount={entry.credit} size="sm" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {account.entries.length > 50 && (
                    <div className="px-8 py-2 text-xs text-muted-foreground italic">
                      + {account.entries.length - 50} ecritures supplementaires
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Grand total */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-100 font-bold border-t">
            <div className="col-span-1" />
            <div className="col-span-5 text-sm">TOTAL GRAND LIVRE</div>
            <div className="col-span-2" />
            <div className="col-span-2 text-right">
              <Money amount={totals.debit} />
            </div>
            <div className="col-span-2 text-right">
              <Money amount={totals.credit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
