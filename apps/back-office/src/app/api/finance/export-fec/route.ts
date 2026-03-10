/**
 * API Route: GET /api/finance/export-fec?year=2025
 *
 * Génère un Fichier des Écritures Comptables (FEC) conforme à la norme DGFIP.
 * Format: TXT, encodage UTF-8, séparateur tabulation.
 *
 * 18 colonnes obligatoires (Article A.47 A-1 du Livre des Procédures Fiscales).
 *
 * Nom du fichier: {SIREN}FEC{YYYYMMDD}.txt
 * (SIREN Verone: à configurer, date = fin exercice)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPcgCategory } from '@verone/finance/lib/pcg-categories';
import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// SIREN Verone (à configurer via env si besoin)
const SIREN = process.env.VERONE_SIREN ?? '000000000';

// FEC column headers (norme DGFIP - ordre obligatoire)
const FEC_HEADERS = [
  'JournalCode',
  'JournalLib',
  'EcritureNum',
  'EcritureDate',
  'CompteNum',
  'CompteLib',
  'CompAuxNum',
  'CompAuxLib',
  'PieceRef',
  'PieceDate',
  'EcritureLib',
  'Debit',
  'Credit',
  'EcritureLet',
  'DateLet',
  'ValidDate',
  'Montantdevise',
  'Idevise',
];

function formatFecDate(dateStr: string | null): string {
  if (!dateStr) return '';
  // FEC format: YYYYMMDD
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function formatFecAmount(amount: number): string {
  // FEC format: montant avec virgule décimale (norme française)
  return Math.abs(amount).toFixed(2).replace('.', ',');
}

function getJournalCode(side: string, categoryPcg: string | null): string {
  // Journaux comptables standards
  if (side === 'credit') return 'VE'; // Ventes
  if (categoryPcg?.startsWith('6')) return 'AC'; // Achats
  if (categoryPcg?.startsWith('5')) return 'BQ'; // Banque
  return 'OD'; // Opérations diverses
}

function getJournalLib(code: string): string {
  const labels: Record<string, string> = {
    VE: 'Journal des ventes',
    AC: 'Journal des achats',
    BQ: 'Journal de banque',
    OD: 'Opérations diverses',
  };
  return labels[code] ?? 'Journal';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Params
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');

    if (!year || !/^\d{4}$/.test(year)) {
      return NextResponse.json(
        { error: 'Paramètre year requis (format: YYYY)' },
        { status: 400 }
      );
    }

    // 3. Fetch transactions for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: transactions, error } = await supabase
      .from('bank_transactions')
      .select(
        'id, transaction_id, amount, settled_at, emitted_at, label, counterparty_name, category_pcg, reference, side, matched_document:financial_documents!matched_document_id(document_date, document_number)'
      )
      .gte('settled_at', startDate)
      .lte('settled_at', endDate)
      .order('settled_at', { ascending: true })
      .limit(10000);

    if (error) {
      return NextResponse.json(
        { error: `Erreur requête: ${error.message}` },
        { status: 500 }
      );
    }

    // 4. Generate FEC lines
    const lines: string[] = [];

    // Header line
    lines.push(FEC_HEADERS.join('\t'));

    // Data lines (one per transaction, double entry: debit + credit)
    let ecritureNum = 1;
    let skippedCount = 0;

    for (const tx of transactions ?? []) {
      const categoryPcg = tx.category_pcg;

      // Skip transactions without PCG classification (no fictitious accounts)
      if (!categoryPcg) {
        skippedCount++;
        continue;
      }

      // Dates FEC: PieceDate ≤ EcritureDate ≤ ValidDate (norme DGFIP)
      const settlementDate = tx.settled_at ?? tx.emitted_at;
      const ecritureDate = formatFecDate(settlementDate);

      // PieceDate = date du document (facture) si disponible, sinon date de règlement
      const matchedDoc = tx.matched_document as {
        document_date: string | null;
        document_number: string | null;
      } | null;
      const pieceDate = formatFecDate(
        matchedDoc?.document_date ?? settlementDate
      );

      const amount = Math.abs(tx.amount);
      const side = tx.side as string | null;
      const isCredit = side === 'credit' || tx.amount > 0;

      // Determine accounts
      const journalCode = getJournalCode(
        isCredit ? 'credit' : 'debit',
        categoryPcg
      );
      const journalLib = getJournalLib(journalCode);

      // PCG account for the expense/revenue — padded to 6 digits (norme FEC)
      const compteNum = categoryPcg.padEnd(6, '0');
      const pcgInfo = getPcgCategory(categoryPcg.substring(0, 2));
      const compteLib = pcgInfo?.label ?? (isCredit ? 'Ventes' : 'Achats');

      // Bank account (512000 = Banque)
      const compteBanque = '512000';
      const libBanque = 'Banque';

      const pieceRef = tx.reference ?? tx.transaction_id ?? '';
      const ecritureLib =
        tx.counterparty_name ?? tx.label ?? 'Transaction bancaire';
      const numStr = String(ecritureNum).padStart(6, '0');

      // Line 1: Expense/Revenue account
      const line1 = [
        journalCode,
        journalLib,
        numStr,
        ecritureDate,
        compteNum,
        compteLib,
        '', // CompAuxNum
        '', // CompAuxLib
        pieceRef,
        pieceDate, // PieceDate = date document (facture)
        ecritureLib,
        isCredit ? '' : formatFecAmount(amount), // Debit
        isCredit ? formatFecAmount(amount) : '', // Credit
        '', // EcritureLet
        '', // DateLet
        ecritureDate, // ValidDate = date de comptabilisation
        '', // Montantdevise
        '', // Idevise
      ].join('\t');

      // Line 2: Bank account (counterpart)
      const line2 = [
        journalCode,
        journalLib,
        numStr,
        ecritureDate,
        compteBanque,
        libBanque,
        '', // CompAuxNum
        '', // CompAuxLib
        pieceRef,
        pieceDate, // PieceDate = date document (facture)
        ecritureLib,
        isCredit ? formatFecAmount(amount) : '', // Debit (bank receives)
        isCredit ? '' : formatFecAmount(amount), // Credit (bank pays)
        '', // EcritureLet
        '', // DateLet
        ecritureDate, // ValidDate = date de comptabilisation
        '', // Montantdevise
        '', // Idevise
      ].join('\t');

      lines.push(line1);
      lines.push(line2);
      ecritureNum++;
    }

    // 5. Build response
    const content = lines.join('\r\n');
    const filename = `${SIREN}FEC${year}1231.txt`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-FEC-Skipped-Transactions': String(skippedCount),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
