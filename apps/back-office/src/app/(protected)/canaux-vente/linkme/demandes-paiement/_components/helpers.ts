import { type PaymentRequestAdmin } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Génère un lien mailto avec sujet et corps pré-remplis
 * pour contacter un affilié au sujet de sa demande de versement
 */
export function generateMailtoLink(request: PaymentRequestAdmin): string {
  const subject = `Demande de versement ${request.requestNumber} - LinkMe Vérone`;

  let body = `Bonjour ${request.affiliateName},\n\n`;

  if (request.status === 'pending') {
    body += `Votre demande de versement ${request.requestNumber} est en attente de votre facture.\n\n`;
    body += `Montant de la commission : ${formatCurrency(request.totalAmountTTC)} TTC\n\n`;
    body += `Merci de nous faire parvenir votre facture pour que nous puissions procéder au règlement.\n\n`;
  } else if (request.status === 'invoice_received') {
    body += `Nous avons bien reçu votre facture pour la demande ${request.requestNumber}.\n\n`;
    body += `Montant : ${formatCurrency(request.totalAmountTTC)} TTC\n\n`;
    body += `Le paiement sera effectué dans les meilleurs délais.\n\n`;
  } else if (request.status === 'paid') {
    body += `Votre demande de versement ${request.requestNumber} a été réglée.\n\n`;
    body += `Montant versé : ${formatCurrency(request.totalAmountTTC)} TTC\n`;
    if (request.paymentReference) {
      body += `Référence de paiement : ${request.paymentReference}\n`;
    }
    body += '\n';
  }

  body += `Cordialement,\nL'équipe LinkMe Vérone`;

  return `mailto:${request.affiliateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
