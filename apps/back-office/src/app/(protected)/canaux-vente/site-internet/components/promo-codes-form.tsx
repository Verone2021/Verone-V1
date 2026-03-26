'use client';

import type React from 'react';

import {
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
  Switch,
  Textarea,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';

import type { PromoFormData } from './promo-codes-types';

// ============================================
// Promo Form Dialog — field sections
// ============================================

interface PromoFormSetterProps {
  form: PromoFormData;
  setForm: React.Dispatch<React.SetStateAction<PromoFormData>>;
}

function PromoBasicFields({ form, setForm }: PromoFormSetterProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Code *</Label>
          <Input
            value={form.code}
            onChange={e =>
              setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="BIENVENUE10"
            className="font-mono"
          />
        </div>
        <div>
          <Label>Nom *</Label>
          <Input
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Promo bienvenue"
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={e =>
            setForm(prev => ({ ...prev, description: e.target.value }))
          }
          rows={2}
        />
      </div>
    </>
  );
}

function PromoDiscountFields({ form, setForm }: PromoFormSetterProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Type de réduction</Label>
        <Select
          value={form.discount_type}
          onValueChange={v => setForm(prev => ({ ...prev, discount_type: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Pourcentage (%)</SelectItem>
            <SelectItem value="fixed_amount">Montant fixe (€)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>
          Valeur {form.discount_type === 'percentage' ? '(%)' : '(€)'}
        </Label>
        <Input
          type="number"
          min={0}
          value={form.discount_value}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              discount_value: parseFloat(e.target.value) || 0,
            }))
          }
        />
      </div>
    </div>
  );
}

function PromoAmountLimitsFields({ form, setForm }: PromoFormSetterProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Montant min. commande (€)</Label>
        <Input
          type="number"
          value={form.min_order_amount}
          onChange={e =>
            setForm(prev => ({ ...prev, min_order_amount: e.target.value }))
          }
          placeholder="Pas de minimum"
        />
      </div>
      <div>
        <Label>Réduction max. (€)</Label>
        <Input
          type="number"
          value={form.max_discount_amount}
          onChange={e =>
            setForm(prev => ({ ...prev, max_discount_amount: e.target.value }))
          }
          placeholder="Pas de plafond"
        />
      </div>
    </div>
  );
}

function PromoDatesAndUsageFields({ form, setForm }: PromoFormSetterProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Valide du</Label>
          <Input
            type="date"
            value={form.valid_from}
            onChange={e =>
              setForm(prev => ({ ...prev, valid_from: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Valide jusqu&apos;au</Label>
          <Input
            type="date"
            value={form.valid_until}
            onChange={e =>
              setForm(prev => ({ ...prev, valid_until: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Utilisations max. (total)</Label>
          <Input
            type="number"
            value={form.max_uses_total}
            onChange={e =>
              setForm(prev => ({ ...prev, max_uses_total: e.target.value }))
            }
            placeholder="Illimité"
          />
        </div>
        <div>
          <Label>Max. par client</Label>
          <Input
            type="number"
            min={1}
            value={form.max_uses_per_customer}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                max_uses_per_customer: parseInt(e.target.value, 10) || 1,
              }))
            }
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.is_active}
          onCheckedChange={checked =>
            setForm(prev => ({ ...prev, is_active: checked }))
          }
        />
        <Label>Code actif</Label>
      </div>
    </>
  );
}

// ============================================
// Promo Form Dialog
// ============================================

interface PromoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PromoFormData;
  setForm: React.Dispatch<React.SetStateAction<PromoFormData>>;
  editingId: string | null;
  onSave: () => void;
  isSaving: boolean;
}

export function PromoFormDialog({
  open,
  onOpenChange,
  form,
  setForm,
  editingId,
  onSave,
  isSaving,
}: PromoFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Modifier le code promo' : 'Nouveau code promo'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <PromoBasicFields form={form} setForm={setForm} />
          <PromoDiscountFields form={form} setForm={setForm} />
          <PromoAmountLimitsFields form={form} setForm={setForm} />
          <PromoDatesAndUsageFields form={form} setForm={setForm} />
        </div>
        <DialogFooter>
          <ButtonV2 variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </ButtonV2>
          <ButtonV2 onClick={onSave} disabled={isSaving}>
            {isSaving
              ? 'Enregistrement...'
              : editingId
                ? 'Mettre à jour'
                : 'Créer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
