'use client';

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// =====================================================================
// TYPES
// =====================================================================

interface ClassifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
  onClassified: () => void;
}

type DocumentType =
  | 'customer_invoice'
  | 'supplier_invoice'
  | 'customer_credit_note'
  | 'supplier_credit_note'
  | 'expense';

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'customer_invoice', label: 'Facture client' },
  { value: 'supplier_invoice', label: 'Facture fournisseur' },
  { value: 'customer_credit_note', label: 'Avoir client' },
  { value: 'supplier_credit_note', label: 'Avoir fournisseur' },
  { value: 'expense', label: 'Dépense' },
];

const DIRECTION_MAP: Record<DocumentType, 'inbound' | 'outbound'> = {
  customer_invoice: 'inbound',
  supplier_invoice: 'outbound',
  customer_credit_note: 'outbound',
  supplier_credit_note: 'inbound',
  expense: 'outbound',
};

// =====================================================================
// COMPONENT
// =====================================================================

export function ClassifyDialog({
  open,
  onOpenChange,
  fileUrl,
  fileName,
  onClassified,
}: ClassifyDialogProps) {
  const [docType, setDocType] = useState<DocumentType>('supplier_invoice');
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalHt, setTotalHt] = useState('');
  const [totalTtc, setTotalTtc] = useState('');
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const handleSubmit = async () => {
    if (!docNumber || !docDate) {
      toast.error('Numéro de document et date requis');
      return;
    }

    setSaving(true);
    try {
      const ht = parseFloat(totalHt) || 0;
      const ttc = parseFloat(totalTtc) || ht;
      const tva = ttc - ht;

      const { error } = await supabase.from('financial_documents').insert({
        document_type: docType,
        document_direction: DIRECTION_MAP[docType],
        document_number: docNumber,
        document_date: docDate,
        total_ht: ht,
        total_ttc: ttc,
        tva_amount: tva,
        status: 'draft' as const,
        uploaded_file_url: fileUrl,
        uploaded_file_name: fileName,
        uploaded_at: new Date().toISOString(),
        partner_id: '00000000-0000-0000-0000-000000000000', // Placeholder — will be updated
        partner_type: docType.includes('supplier') ? 'supplier' : 'customer',
        created_by: 'manual-upload',
      });

      if (error) {
        toast.error(`Erreur : ${error.message}`);
        return;
      }

      toast.success('Document classé avec succès');
      onOpenChange(false);
      onClassified();

      // Reset
      setDocNumber('');
      setTotalHt('');
      setTotalTtc('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Classer le document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground truncate">
            Fichier : {fileName}
          </div>

          <div className="space-y-2">
            <Label>Type de document</Label>
            <Select
              value={docType}
              onValueChange={v => setDocType(v as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>N° document</Label>
            <Input
              value={docNumber}
              onChange={e => setDocNumber(e.target.value)}
              placeholder="ex: FA-2026-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={docDate}
              onChange={e => setDocDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant HT</Label>
              <Input
                type="number"
                step="0.01"
                value={totalHt}
                onChange={e => setTotalHt(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Montant TTC</Label>
              <Input
                type="number"
                step="0.01"
                value={totalTtc}
                onChange={e => setTotalTtc(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={saving || !docNumber}
          >
            {saving ? 'Enregistrement...' : 'Classer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
