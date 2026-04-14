'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Calendar } from 'lucide-react';

interface IInvoiceServiceOptionsSectionProps {
  issueDate: string;
  paymentTerms: string;
  reference: string;
  onIssueDateChange: (value: string) => void;
  onPaymentTermsChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
}

export function InvoiceServiceOptionsSection({
  issueDate,
  paymentTerms,
  reference,
  onIssueDateChange,
  onPaymentTermsChange,
  onReferenceChange,
}: IInvoiceServiceOptionsSectionProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date et options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Date de facture *</Label>
          <Input
            type="date"
            value={issueDate}
            onChange={e => onIssueDateChange(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Conditions de paiement</Label>
            <Select value={paymentTerms} onValueChange={onPaymentTermsChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immédiat</SelectItem>
                <SelectItem value="net_15">15 jours</SelectItem>
                <SelectItem value="net_30">30 jours</SelectItem>
                <SelectItem value="net_60">60 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Référence (optionnel)</Label>
            <Input
              placeholder="Ex: Contrat 2026-001"
              value={reference}
              onChange={e => onReferenceChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
