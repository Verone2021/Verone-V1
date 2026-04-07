'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@verone/ui';
import { Calendar, Info } from 'lucide-react';

interface IInvoiceInfoSectionProps {
  issueDate: string;
  setIssueDate: (v: string) => void;
  invoiceLabel: string;
  setInvoiceLabel: (v: string) => void;
  loadingNextNumber: boolean;
  nextInvoiceNumber: string | null;
}

export function InvoiceInfoSection({
  issueDate,
  setIssueDate,
  invoiceLabel,
  setInvoiceLabel,
  loadingNextNumber,
  nextInvoiceNumber,
}: IInvoiceInfoSectionProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Informations facture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Date de facture *</Label>
            <Input
              type="date"
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label / Titre (optionnel)</Label>
            <Input
              value={invoiceLabel}
              onChange={e => setInvoiceLabel(e.target.value)}
              placeholder="Ex: Facture mobilier Pokawa"
              className="h-8"
            />
          </div>
        </div>
        {/* Prochain numéro de facture (approximatif) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <Info className="h-3 w-3 flex-shrink-0" />
          {loadingNextNumber ? (
            <span>Chargement du prochain numéro...</span>
          ) : nextInvoiceNumber ? (
            <span>
              Prochain numéro : <strong>{nextInvoiceNumber}</strong>{' '}
              (approximatif, attribué par Qonto)
            </span>
          ) : (
            <span>
              Le numéro de facture sera attribué par Qonto à la création
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
