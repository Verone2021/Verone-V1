'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { ExternalLink, FileX, Info } from 'lucide-react';

export interface IInvoiceForCreditNote {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  total_vat_amount: number;
  subtotal_amount: number;
  currency: string;
  client_id: string;
  client?: {
    name?: string;
    email?: string | null;
  } | null;
  items?: Array<{
    id?: string;
    title: string;
    description?: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
  }>;
}

interface ICreditNoteCreateModalProps {
  invoice: IInvoiceForCreditNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (creditNoteId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  finalized: 'Finalise',
  unpaid: 'Non payee',
  paid: 'Payee',
  overdue: 'En retard',
  canceled: 'Annulee',
  cancelled: 'Annulee',
  pending_approval: 'En attente',
  to_review: 'A examiner',
  to_pay: 'A payer',
};

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Modal informatif pour la creation d'avoirs.
 *
 * L'API Qonto ne supporte PAS la creation programmatique d'avoirs
 * (seuls GET /v2/credit_notes et GET /v2/credit_notes/{id} existent).
 * Les avoirs doivent etre crees directement sur le dashboard Qonto.
 * Apres creation, ils apparaissent automatiquement dans la liste des avoirs.
 */
export function CreditNoteCreateModal({
  invoice,
  open,
  onOpenChange,
}: ICreditNoteCreateModalProps): React.ReactNode {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5" />
            Creer un avoir
          </DialogTitle>
          <DialogDescription>
            Sur facture {invoice.invoice_number} -{' '}
            {invoice.client?.name || 'Client'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info facture de reference */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Facture de reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.client?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatAmount(invoice.total_amount, invoice.currency)}
                  </span>
                  <Badge variant="outline">
                    {STATUS_LABELS[invoice.status] ?? invoice.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message informatif */}
          <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-800">
                Les avoirs doivent etre crees sur Qonto
              </p>
              <p className="text-blue-700">
                L&apos;API Qonto ne permet pas la creation d&apos;avoirs par
                programme. Rendez-vous sur le dashboard Qonto pour creer
                l&apos;avoir correspondant a cette facture.
              </p>
              <p className="text-blue-700">
                Apres creation sur Qonto, l&apos;avoir apparaitra
                automatiquement dans l&apos;onglet &quot;Avoirs&quot; de cette
                page.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button asChild>
            <a
              href="https://app.qonto.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir Qonto
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
