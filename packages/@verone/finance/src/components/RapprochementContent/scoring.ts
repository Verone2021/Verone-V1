// =====================================================================
// SCORING ALGORITHM — Cardinality-based decision tree
// Pure functional — NO React, NO state, NO side effects
// =====================================================================

import type { CreditTransaction, OrderForLink } from './types';

/**
 * Decision-tree scoring for bank reconciliation.
 *
 * Score = degree of uniqueness, NOT a weighted average.
 * Steps:
 *   0. Exact reference in label → 100% (short-circuit)
 *   1. Count transactions with exact amount (N_amount)
 *   2. Among those, count name matches (N_name)
 *   3. Decision tree based on cardinality
 *   4. Fallback: fuzzy amount + weighted average
 *
 * Returns a percentage score (0-100) and a priority bucket.
 */
export function calculateMatch(
  order: OrderForLink,
  transaction: CreditTransaction,
  allTransactions: CreditTransaction[],
  orderType: 'sales_order' | 'purchase_order' | 'avoir' = 'sales_order'
): { priority: string; score: number; reasons: string[]; sortOrder: number } {
  const reasons: string[] = [];

  // Use absolute value: avoirs have negative total_ttc but debit transactions are also
  // stored as negative amounts — compare absolute values for correct matching.
  // For partially paid orders, score against the REMAINING amount (total - paid)
  // so suggestions match what's left to reconcile, not the full invoice total.
  const totalAmount = Math.abs(order.total_ttc);
  const paidAmount = order.paid_amount ?? 0;
  const remaining = totalAmount - paidAmount;
  const orderAmount = remaining > 0.01 ? remaining : totalAmount;
  const txAmount = Math.abs(transaction.amount);
  const amountDiff = Math.abs(txAmount - orderAmount);
  const amountPct = orderAmount > 0 ? (amountDiff / orderAmount) * 100 : 100;

  // DATE: use order_date (real date), not created_at
  const orderDate = order.shipped_at
    ? new Date(order.shipped_at)
    : new Date(order.order_date ?? order.created_at);
  const txDate = new Date(transaction.settled_at ?? transaction.emitted_at);
  const daysDiff = Math.abs(
    (txDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // DATE FILTER: >2 years = excluded
  if (daysDiff > 730) {
    return {
      priority: 'excluded',
      score: 0,
      reasons: ['Date trop ancienne'],
      sortOrder: 999,
    };
  }

  // --- NAME MATCHING (boolean: matches or not) ---
  const orderNames = [order.customer_name, order.customer_name_alt]
    .filter(Boolean)
    .map(n => (n as string).toLowerCase().trim());
  const txLabel = (transaction.label ?? '').toLowerCase().trim();
  const txCounterparty = (transaction.counterparty_name ?? '')
    .toLowerCase()
    .trim();

  let nameMatches = false;
  for (const orderName of orderNames) {
    if (orderName.length < 3) continue;
    const nameWords = orderName.split(/[\s,.-]+/).filter(w => w.length >= 3);
    const matchedInLabel = nameWords.some(w => txLabel.includes(w));
    const matchedInCounterparty =
      txCounterparty.length > 0 &&
      nameWords.some(w => txCounterparty.includes(w));
    if (matchedInLabel || matchedInCounterparty) {
      nameMatches = true;
      break;
    }
  }

  if (nameMatches) {
    reasons.push(
      orderType === 'purchase_order' ? 'Nom fournisseur' : 'Nom client'
    );
  }

  // --- STEP 0: Exact reference match (short-circuit) ---
  const searchText = (transaction.label ?? '').toUpperCase();
  const txCounterpartyUpper = (
    transaction.counterparty_name ?? ''
  ).toUpperCase();
  const orderRef = order.order_number.toUpperCase();
  if (searchText.includes(orderRef) || txCounterpartyUpper.includes(orderRef)) {
    reasons.push('Ref. trouvée');
    if (amountDiff < 0.01) reasons.push('Montant exact');
    return {
      priority: 'excellent',
      score: 100,
      reasons,
      sortOrder: 0,
    };
  }

  // --- STEP 1: Cardinality — how many transactions have the exact amount? ---
  const exactAmountTxs = allTransactions.filter(tx => {
    const amt = Math.abs(tx.amount);
    return Math.abs(amt - orderAmount) < 0.01;
  });
  const nAmount = exactAmountTxs.length;

  // --- STEP 2: Among exact-amount, how many match the supplier name? ---
  const exactAmountAndNameTxs = exactAmountTxs.filter(tx => {
    const label = (tx.label ?? '').toLowerCase().trim();
    const counterparty = (tx.counterparty_name ?? '').toLowerCase().trim();
    for (const oName of orderNames) {
      if (oName.length < 3) continue;
      const nameWords = oName.split(/[\s,.-]+/).filter(w => w.length >= 3);
      if (
        nameWords.some(w => label.includes(w)) ||
        (counterparty.length > 0 &&
          nameWords.some(w => counterparty.includes(w)))
      )
        return true;
    }
    return false;
  });
  const nName = exactAmountAndNameTxs.length;

  // --- DECISION TREE ---
  const isExactAmount = amountDiff < 0.01;

  if (isExactAmount) {
    reasons.push('Montant exact');

    if (nAmount === 1) {
      // Only ONE transaction with this exact amount
      if (nameMatches) {
        // Unique amount + name match = total certainty
        return {
          priority: 'excellent',
          score: 100,
          reasons,
          sortOrder: 0,
        };
      }
      // Unique amount but name doesn't match — still very likely
      return {
        priority: 'excellent',
        score: 90,
        reasons,
        sortOrder: 10,
      };
    }

    // nAmount > 1: multiple transactions with same exact amount
    if (nName === 0) {
      // None match the name — amount ok but no name confirmation
      return {
        priority: 'excellent',
        score: 80,
        reasons,
        sortOrder: 20,
      };
    }

    if (nName === 1) {
      // Only ONE matches both amount AND name = uniqueness recovered
      if (nameMatches) {
        return {
          priority: 'excellent',
          score: 100,
          reasons,
          sortOrder: 0,
        };
      }
      // This transaction has the amount but NOT the name — demote
      return {
        priority: 'good',
        score: 50,
        reasons,
        sortOrder: 50,
      };
    }

    // nName > 1: multiple match both amount AND name — use date proximity
    if (nameMatches) {
      // Sort by date proximity, give decreasing scores
      const sortedByDate = [...exactAmountAndNameTxs].sort((a, b) => {
        const dateA = new Date(a.settled_at ?? a.emitted_at);
        const dateB = new Date(b.settled_at ?? b.emitted_at);
        return (
          Math.abs(dateA.getTime() - orderDate.getTime()) -
          Math.abs(dateB.getTime() - orderDate.getTime())
        );
      });
      const rank = sortedByDate.findIndex(tx => tx.id === transaction.id);
      const score = Math.max(95 - rank * 5, 70);
      if (rank === 0) reasons.push('Date la plus proche');
      return {
        priority: 'excellent',
        score,
        reasons,
        sortOrder: 100 - score,
      };
    }

    // Has exact amount, multiple name matches exist, but THIS one doesn't match name
    return {
      priority: 'good',
      score: 50,
      reasons,
      sortOrder: 50,
    };
  }

  // --- NO EXACT AMOUNT: Fuzzy matching ---
  if (amountDiff <= 1 && nameMatches) {
    reasons.push('Montant ~1\u00A0\u20AC');
    return {
      priority: 'excellent',
      score: 90,
      reasons,
      sortOrder: 10,
    };
  }

  if (amountPct <= 2 && nameMatches) {
    reasons.push(`\u00B1${amountPct.toFixed(1)}%`);
    return {
      priority: 'excellent',
      score: 85,
      reasons,
      sortOrder: 15,
    };
  }

  if (amountPct <= 5 && nameMatches) {
    reasons.push(`\u00B1${amountPct.toFixed(1)}%`);
    return {
      priority: 'excellent',
      score: 75,
      reasons,
      sortOrder: 25,
    };
  }

  // --- FALLBACK: weighted average for weak matches ---
  let amountScore = 0;
  if (amountDiff <= 1) {
    amountScore = 95;
  } else if (amountPct <= 2) {
    amountScore = 85;
  } else if (amountPct <= 5) {
    amountScore = 65;
  } else if (amountPct <= 10) {
    amountScore = 40;
  }

  const nameScore = nameMatches ? 80 : 0;

  let dateScore = 0;
  if (daysDiff <= 3) {
    dateScore = 100;
  } else if (daysDiff <= 7) {
    dateScore = 85;
  } else if (daysDiff <= 14) {
    dateScore = 70;
  } else if (daysDiff <= 30) {
    dateScore = 50;
  } else if (daysDiff <= 90) {
    dateScore = 25;
  }

  const finalScore = Math.round(
    amountScore * 0.35 + nameScore * 0.4 + dateScore * 0.15
  );

  if (finalScore >= 50) {
    if (amountPct <= 10) reasons.push(`\u00B1${amountPct.toFixed(1)}%`);
    return {
      priority: 'good',
      score: finalScore,
      reasons,
      sortOrder: 100 - finalScore,
    };
  } else if (finalScore >= 25) {
    return {
      priority: 'partial',
      score: finalScore,
      reasons,
      sortOrder: 100 - finalScore,
    };
  }

  return { priority: 'none', score: finalScore, reasons: [], sortOrder: 100 };
}

export function getMatchLabel(priority: string): {
  label: string;
  color: string;
  isGreen: boolean;
} {
  switch (priority) {
    case 'excellent':
      return {
        label: 'Match fort',
        color: 'bg-green-100 text-green-800 border-green-300',
        isGreen: true,
      };
    case 'good':
      return {
        label: 'Match probable',
        color: 'bg-green-100 text-green-800 border-green-300',
        isGreen: true,
      };
    case 'partial':
      return {
        label: 'Match partiel',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        isGreen: false,
      };
    case 'excluded':
      return {
        label: 'Date trop ancienne',
        color: 'bg-red-100 text-red-800 border-red-300',
        isGreen: false,
      };
    default:
      return {
        label: '',
        color: 'bg-gray-100 text-gray-600 border-gray-300',
        isGreen: false,
      };
  }
}
