import type { BankTransaction } from '@verone/finance';
import { calculateHT, calculateVAT } from '@verone/finance';

type TransactionWithVat = BankTransaction & { vat_rate?: number };

export interface MonthlyTva {
  month: string;
  label: string;
  totalCollectee: number;
  totalDeductible: number;
  caHT: number;
  reportCreditPrecedent: number;
  totalDeductibleAvecReport: number;
  tvaNettedue: number;
  creditTva: number;
  creditAReporter: number;
}

export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function computeMonthlyTva(
  creditTransactions: BankTransaction[],
  debitTransactions: BankTransaction[],
  selectedYear: string
): MonthlyTva[] {
  const rawMonths = new Map<
    string,
    { collectee: number; deductible: number; caHT: number }
  >();

  (creditTransactions as TransactionWithVat[]).forEach(tx => {
    const date = tx.settled_at ?? tx.emitted_at;
    if (!date) return;
    if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;
    const key = getMonthKey(date);
    const m = rawMonths.get(key) ?? { collectee: 0, deductible: 0, caHT: 0 };
    const vatRate = tx.vat_rate ?? 0;
    m.collectee += calculateVAT(
      Math.abs(tx.amount),
      vatRate as 0 | 5.5 | 10 | 20
    );
    m.caHT += calculateHT(Math.abs(tx.amount), vatRate as 0 | 5.5 | 10 | 20);
    rawMonths.set(key, m);
  });

  (debitTransactions as TransactionWithVat[]).forEach(tx => {
    const date = tx.settled_at ?? tx.emitted_at;
    if (!date) return;
    if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;
    const key = getMonthKey(date);
    const m = rawMonths.get(key) ?? { collectee: 0, deductible: 0, caHT: 0 };
    m.deductible += calculateVAT(
      Math.abs(tx.amount),
      (tx.vat_rate ?? 0) as 0 | 5.5 | 10 | 20
    );
    rawMonths.set(key, m);
  });

  const sortedKeys = Array.from(rawMonths.keys()).sort();
  const result: MonthlyTva[] = [];
  let previousCredit = 0;

  for (const key of sortedKeys) {
    const raw = rawMonths.get(key)!;
    const reportCreditPrecedent = previousCredit;
    const totalDeductibleAvecReport = raw.deductible + reportCreditPrecedent;
    const diff = raw.collectee - totalDeductibleAvecReport;
    const tvaNettedue = diff > 0 ? diff : 0;
    const creditTva = diff < 0 ? Math.abs(diff) : 0;
    const creditAReporter = creditTva;

    result.push({
      month: key,
      label: formatMonthLabel(key),
      totalCollectee: raw.collectee,
      totalDeductible: raw.deductible,
      caHT: raw.caHT,
      reportCreditPrecedent,
      totalDeductibleAvecReport,
      tvaNettedue,
      creditTva,
      creditAReporter,
    });
    previousCredit = creditAReporter;
  }

  return result.reverse();
}
