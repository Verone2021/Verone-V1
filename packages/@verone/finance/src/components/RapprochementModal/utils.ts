// Utilitaires purs pour RapprochementModal

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Calcule un score de matching entre une transaction et une commande.
 * Scoring à PRIORITÉ : montant exact = toujours en haut.
 * customer_name peut contenir plusieurs noms séparés par ' | ' (trade_name | legal_name).
 */
export function calculateMatchScore(
  transactionAmount: number,
  transactionDate: string | undefined,
  transactionOrgId: string | undefined,
  order: {
    total_ttc: number;
    created_at: string;
    organisation_id?: string;
    customer_name?: string;
  },
  counterpartyName?: string | null
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const absAmount = Math.abs(transactionAmount);
  const amountDiff = Math.abs(absAmount - order.total_ttc);
  const isExactAmount = amountDiff < 0.01;

  // NAME MATCHING: split customer_name par ' | ' pour tester legal ET trade
  let nameMatches = false;
  if (order.customer_name && counterpartyName) {
    const names = order.customer_name
      .split(' | ')
      .map(n => n.toLowerCase().trim());
    const cpLower = counterpartyName.toLowerCase().trim();
    // Bidirectionnel : counterparty ⊂ nom OU mot du nom ⊂ counterparty
    nameMatches = names.some(name => {
      if (name.length < 3) return false;
      const words = name.split(/[\s,.-]+/).filter(w => w.length >= 3);
      return (
        cpLower.includes(name) ||
        name.includes(cpLower) ||
        words.some(w => cpLower.includes(w))
      );
    });
  }
  // Fallback: org ID match
  if (
    !nameMatches &&
    transactionOrgId &&
    order.organisation_id === transactionOrgId
  ) {
    nameMatches = true;
  }
  if (nameMatches) reasons.push('Nom correspondant');

  // DATE proximity
  let dateClose = false;
  if (transactionDate) {
    const daysDiff = Math.abs(
      (new Date(transactionDate).getTime() -
        new Date(order.created_at).getTime()) /
        86400000
    );
    if (daysDiff <= 30) dateClose = true;
  }

  // PRIORITY SCORING (montant exact = TOP)
  if (isExactAmount && nameMatches) {
    reasons.push('Montant exact');
    return { score: 100, reasons };
  }
  if (isExactAmount) {
    reasons.push('Montant exact');
    return { score: 90, reasons };
  }

  // Montant proche (±5%) + nom
  const pct = order.total_ttc > 0 ? (amountDiff / order.total_ttc) * 100 : 100;
  if (pct <= 5 && nameMatches) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 80, reasons };
  }
  if (pct <= 5) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 70, reasons };
  }

  // Montant ±10% + nom + date
  if (pct <= 10 && nameMatches && dateClose) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 60, reasons };
  }
  if (pct <= 10 && nameMatches) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 55, reasons };
  }
  if (pct <= 10) {
    reasons.push(`±${pct.toFixed(1)}%`);
    return { score: 45, reasons };
  }

  // Nom seul + date
  if (nameMatches && dateClose) return { score: 35, reasons };
  if (nameMatches) return { score: 25, reasons };

  return { score: 0, reasons };
}
