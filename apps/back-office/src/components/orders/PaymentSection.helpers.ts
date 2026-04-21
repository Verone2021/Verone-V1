/** Invoice linked to a sales order (from financial_documents) */
export interface ILinkedInvoice {
  id: string;
  document_number: string;
  status: string;
  total_ttc: number;
  amount_paid: number;
  document_date: string;
  due_date: string | null;
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
}

/** One bank transaction linked to the order (row in transaction_document_links) */
export interface ILinkedTransaction {
  transactionId: string;
  label: string | null;
  amount: number;
  emittedAt: string | null;
}

export function getInvoiceStatusLabel(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'finalized':
    case 'sent':
      return {
        label: 'Finalisee',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'paid':
      return {
        label: 'Payee',
        className: 'bg-green-100 text-green-800 border-green-200',
      };
    case 'cancelled':
      return {
        label: 'Annulee',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
      };
    case 'synchronized':
    case 'draft':
      return {
        label: 'Brouillon',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      };
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
      };
  }
}
