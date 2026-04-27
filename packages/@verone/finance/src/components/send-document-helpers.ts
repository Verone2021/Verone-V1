import type { DocumentEmailType } from './SendDocumentEmailModal';

export interface AttachmentBlob {
  blob: Blob;
  url: string;
  ready: boolean;
  error: string | null;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const DOC_TYPE_LABELS: Record<DocumentEmailType, string> = {
  quote: 'Devis',
  invoice: 'Facture',
  proforma: 'Facture proforma',
  credit_note: 'Avoir',
};

export const DOC_TYPE_FILENAME_PREFIX: Record<DocumentEmailType, string> = {
  quote: 'devis',
  invoice: 'facture',
  proforma: 'facture-proforma',
  credit_note: 'avoir',
};

export function getDefaultMessage(
  docType: DocumentEmailType,
  docNumber: string,
  options?: { fromConsultation?: boolean }
): string {
  const label = DOC_TYPE_LABELS[docType].toLowerCase();
  // Pour un devis issu d'une consultation, on demande explicitement la validation
  // au client avant de lancer la commande chez le fournisseur (BO-CONSULT-FIX-001).
  const consultationLine =
    docType === 'quote' && options?.fromConsultation
      ? `(Merci de me le valider afin de lancer la commande chez le fournisseur)\n\n`
      : '';
  return `Bonjour,

Veuillez trouver ci-joint votre ${label} n${String.fromCharCode(176)}${docNumber}.
${consultationLine}
N'hesitez pas a nous contacter pour toute question.

Cordialement,
L'equipe Verone`;
}

export function getDefaultSubject(
  docType: DocumentEmailType,
  docNumber: string
): string {
  return `${DOC_TYPE_LABELS[docType]} ${docNumber} — Verone`;
}

/** Send document email to multiple recipients (one API call each for tracking) */
export async function sendToRecipients(params: {
  recipients: string[];
  documentType: DocumentEmailType;
  documentId: string;
  documentNumber: string;
  subject: string;
  message: string;
  attachments: Array<{ filename: string; contentBase64: string; type: string }>;
}): Promise<{ succeeded: number; failed: number }> {
  const results = await Promise.allSettled(
    params.recipients.map(async recipientEmail => {
      const response = await fetch('/api/emails/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: params.documentType,
          documentId: params.documentId,
          documentNumber: params.documentNumber,
          to: recipientEmail,
          subject: params.subject,
          message: params.message,
          attachments: params.attachments,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error ?? `Erreur pour ${recipientEmail}`);
      }
      return recipientEmail;
    })
  );

  return {
    succeeded: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  };
}
