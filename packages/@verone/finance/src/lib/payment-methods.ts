/**
 * Payment methods for bank transactions
 *
 * Standard payment methods used in French accounting
 */

export type BankPaymentMethod =
  | 'virement'
  | 'cb'
  | 'prelevement'
  | 'especes'
  | 'cheque';

export interface BankPaymentMethodOption {
  value: BankPaymentMethod;
  label: string;
  icon: string;
  description: string;
}

/**
 * Available payment methods for selection
 */
export const BANK_PAYMENT_METHODS: BankPaymentMethodOption[] = [
  {
    value: 'virement',
    label: 'Virement',
    icon: '🏦',
    description: 'Transfert bancaire',
  },
  {
    value: 'cb',
    label: 'Carte bancaire',
    icon: '💳',
    description: 'Paiement par carte',
  },
  {
    value: 'prelevement',
    label: 'Prélèvement',
    icon: '📤',
    description: 'Prélèvement automatique',
  },
  {
    value: 'especes',
    label: 'Espèces',
    icon: '💵',
    description: 'Paiement en liquide',
  },
  {
    value: 'cheque',
    label: 'Chèque',
    icon: '📝',
    description: 'Paiement par chèque',
  },
];

/**
 * Get payment method option by value
 */
export function getBankPaymentMethod(
  method: BankPaymentMethod
): BankPaymentMethodOption | undefined {
  return BANK_PAYMENT_METHODS.find(option => option.value === method);
}

/**
 * Format payment method for display
 */
export function formatBankPaymentMethod(method: BankPaymentMethod): string {
  const option = getBankPaymentMethod(method);
  return option ? option.label : method;
}

/**
 * Detect payment method from transaction label
 */
export function detectBankPaymentMethod(
  label: string
): BankPaymentMethod | null {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('virement') || lowerLabel.includes('vir ')) {
    return 'virement';
  }

  if (
    lowerLabel.includes('carte') ||
    lowerLabel.includes('cb ') ||
    lowerLabel.includes('visa') ||
    lowerLabel.includes('mastercard')
  ) {
    return 'cb';
  }

  if (
    lowerLabel.includes('prelevement') ||
    lowerLabel.includes('prlv') ||
    lowerLabel.includes('sepa')
  ) {
    return 'prelevement';
  }

  if (lowerLabel.includes('cheque') || lowerLabel.includes('chq')) {
    return 'cheque';
  }

  if (
    lowerLabel.includes('espece') ||
    lowerLabel.includes('cash') ||
    lowerLabel.includes('retrait')
  ) {
    return 'especes';
  }

  return null;
}
