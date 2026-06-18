'use client';

/**
 * Dialog de correction TVA + code comptable PCG pour une ligne de clôture.
 * Réutilise la logique de TransactionPanelActions / api/transactions/update-vat.
 * [BO-COMPTA-001]
 */

import { useCallback, useState } from 'react';

import { getPcgCategory, getPcgCategoriesByType } from '@verone/finance';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import type { ClotureRow } from '../types';

const VAT_OPTIONS = [
  { label: 'Non renseignée', value: 'null' },
  { label: '0%', value: '0' },
  { label: '5,5%', value: '5.5' },
  { label: '10%', value: '10' },
  { label: '20%', value: '20' },
];

interface ClotureVatPcgDialogProps {
  row: ClotureRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ClotureVatPcgDialog({
  row,
  open,
  onOpenChange,
  onSaved,
}: ClotureVatPcgDialogProps) {
  const [vatValue, setVatValue] = useState<string>('null');
  const [pcgValue, setPcgValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Pré-remplir quand le row change
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen && row) {
        setVatValue(row.vat_rate !== null ? String(row.vat_rate) : 'null');
        setPcgValue(row.category_pcg ?? '');
      }
      onOpenChange(isOpen);
    },
    [row, onOpenChange]
  );

  const pcgOptions = getPcgCategoriesByType('all');

  const handleSave = useCallback(async () => {
    if (!row) return;
    setSaving(true);
    try {
      // 1. Mise à jour TVA via la route dédiée (pose vat_source='manual')
      const vatRate = vatValue === 'null' ? null : Number(vatValue);
      const vatRes = await fetch('/api/transactions/update-vat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: row.id,
          vat_rate: vatRate,
        }),
      });
      if (!vatRes.ok) {
        const err = (await vatRes.json()) as { error?: string };
        throw new Error(err.error ?? 'Erreur mise à jour TVA');
      }

      // 2. Mise à jour PCG directement (pas de route dédiée — update Supabase client)
      if (pcgValue !== (row.category_pcg ?? '')) {
        const supabase = createClient();
        const { error: pcgErr } = await supabase
          .from('bank_transactions')
          .update({ category_pcg: pcgValue || null })
          .eq('id', row.id);
        if (pcgErr) throw new Error(pcgErr.message);
      }

      toast.success('TVA et code comptable mis à jour');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  }, [row, vatValue, pcgValue, onOpenChange, onSaved]);

  if (!row) return null;

  const currentPcg = pcgValue
    ? (getPcgCategory(pcgValue)?.label ?? pcgValue)
    : 'Non renseigné';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Corriger TVA et code comptable</DialogTitle>
        </DialogHeader>

        {/* Info ligne */}
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          <p className="font-medium truncate">
            {row.partner_name ?? row.document_number ?? row.id}
          </p>
          {row.document_date && (
            <p className="text-muted-foreground text-xs mt-0.5">
              {new Date(row.document_date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              {row.total_ttc != null && (
                <span className="ml-2 font-medium text-foreground">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(row.total_ttc)}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* TVA */}
          <div className="space-y-1.5">
            <Label htmlFor="vat-select">Taux de TVA</Label>
            <Select value={vatValue} onValueChange={setVatValue}>
              <SelectTrigger id="vat-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VAT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              La modification définit la source à « manuel »
            </p>
          </div>

          {/* Code comptable PCG */}
          <div className="space-y-1.5">
            <Label htmlFor="pcg-select">Code comptable (PCG)</Label>
            <Select
              value={pcgValue || 'none'}
              onValueChange={v => setPcgValue(v === 'none' ? '' : v)}
            >
              <SelectTrigger id="pcg-select">
                <SelectValue placeholder="Choisir un code...">
                  {pcgValue ? `${pcgValue} — ${currentPcg}` : 'Non renseigné'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="none">Non renseigné</SelectItem>
                {pcgOptions.map(cat => (
                  <SelectItem key={cat.code} value={cat.code}>
                    {cat.code} — {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
