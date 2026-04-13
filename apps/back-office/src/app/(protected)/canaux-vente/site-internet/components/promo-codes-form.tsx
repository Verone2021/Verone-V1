'use client';

import type React from 'react';

import {
  Checkbox,
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
// Types for selectors
// ============================================

interface SelectableItem {
  id: string;
  name: string;
}

interface PromoFormSetterProps {
  form: PromoFormData;
  setForm: React.Dispatch<React.SetStateAction<PromoFormData>>;
}

interface PromoFormSetterWithDataProps extends PromoFormSetterProps {
  products: SelectableItem[];
  collections: SelectableItem[];
}

// ============================================
// Field sections
// ============================================

function PromoBasicFields({ form, setForm }: PromoFormSetterProps) {
  return (
    <>
      {/* Automatic toggle */}
      <div className="flex items-center gap-3 rounded-lg border p-3 bg-gray-50">
        <Switch
          checked={form.is_automatic}
          onCheckedChange={checked =>
            setForm(prev => ({
              ...prev,
              is_automatic: checked,
              code: checked ? '' : prev.code,
            }))
          }
        />
        <div>
          <Label className="font-medium">Promotion automatique</Label>
          <p className="text-xs text-muted-foreground">
            Appliquee sans code quand les conditions sont remplies
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {!form.is_automatic && (
          <div>
            <Label>Code *</Label>
            <Input
              value={form.code}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="BIENVENUE10"
              className="font-mono"
            />
          </div>
        )}
        <div className={form.is_automatic ? 'col-span-2' : ''}>
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
        <Label>Type de reduction</Label>
        <Select
          value={form.discount_type}
          onValueChange={v => setForm(prev => ({ ...prev, discount_type: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Pourcentage (%)</SelectItem>
            <SelectItem value="fixed_amount">Montant fixe (EUR)</SelectItem>
            <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.discount_type !== 'free_shipping' && (
        <div>
          <Label>
            Valeur {form.discount_type === 'percentage' ? '(%)' : '(EUR)'}
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
      )}
    </div>
  );
}

function PromoTargetingFields({
  form,
  setForm,
  products,
  collections,
}: PromoFormSetterWithDataProps) {
  const items =
    form.target_type === 'products'
      ? products
      : form.target_type === 'collections'
        ? collections
        : [];

  return (
    <div className="space-y-3">
      <div>
        <Label>Ciblage</Label>
        <Select
          value={form.target_type}
          onValueChange={(v: 'all' | 'products' | 'collections') =>
            setForm(prev => ({
              ...prev,
              target_type: v,
              selected_target_ids: [],
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les produits</SelectItem>
            <SelectItem value="products">Produits specifiques</SelectItem>
            <SelectItem value="collections">Collections specifiques</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.target_type !== 'all' && (
        <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              Aucun {form.target_type === 'products' ? 'produit' : 'collection'}{' '}
              disponible
            </p>
          ) : (
            items.map(item => (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
              >
                <Checkbox
                  checked={form.selected_target_ids.includes(item.id)}
                  onCheckedChange={checked => {
                    setForm(prev => ({
                      ...prev,
                      selected_target_ids: checked
                        ? [...prev.selected_target_ids, item.id]
                        : prev.selected_target_ids.filter(id => id !== item.id),
                    }));
                  }}
                />
                <span className="text-sm">{item.name}</span>
              </label>
            ))
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Switch
          checked={form.exclude_sale_items}
          onCheckedChange={checked =>
            setForm(prev => ({ ...prev, exclude_sale_items: checked }))
          }
        />
        <Label className="text-sm">Exclure les articles deja en promo</Label>
      </div>
    </div>
  );
}

function PromoAmountLimitsFields({ form, setForm }: PromoFormSetterProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Montant min. commande (EUR)</Label>
        <Input
          type="number"
          value={form.min_order_amount}
          onChange={e =>
            setForm(prev => ({ ...prev, min_order_amount: e.target.value }))
          }
          placeholder="Pas de minimum"
        />
      </div>
      {form.discount_type !== 'free_shipping' && (
        <div>
          <Label>Reduction max. (EUR)</Label>
          <Input
            type="number"
            value={form.max_discount_amount}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                max_discount_amount: e.target.value,
              }))
            }
            placeholder="Pas de plafond"
          />
        </div>
      )}
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
            placeholder="Illimite"
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
        <Label>Promotion active</Label>
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
  products: SelectableItem[];
  collections: SelectableItem[];
}

export function PromoFormDialog({
  open,
  onOpenChange,
  form,
  setForm,
  editingId,
  onSave,
  isSaving,
  products,
  collections,
}: PromoFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Modifier la promotion' : 'Nouvelle promotion'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <PromoBasicFields form={form} setForm={setForm} />
          <PromoDiscountFields form={form} setForm={setForm} />
          <PromoTargetingFields
            form={form}
            setForm={setForm}
            products={products}
            collections={collections}
          />
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
                ? 'Mettre a jour'
                : 'Creer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
