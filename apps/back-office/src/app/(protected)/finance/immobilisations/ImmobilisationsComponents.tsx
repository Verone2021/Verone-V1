'use client';

import { useState } from 'react';

import {
  PCG_IMMOBILISATION_ACCOUNTS,
  computeDepreciationSchedule,
  type FixedAsset,
  type FixedAssetFormData,
} from '@verone/finance';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import {
  Building2,
  Monitor,
  Landmark,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';

export function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'incorporel':
      return <Landmark className="h-4 w-4" />;
    case 'financier':
      return <Building2 className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

export function getCategoryLabel(cat: string) {
  switch (cat) {
    case 'incorporel':
      return 'Incorporel';
    case 'financier':
      return 'Financier';
    default:
      return 'Corporel';
  }
}

export function AssetRow({
  asset,
  onDelete,
}: {
  asset: FixedAsset;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const schedule = computeDepreciationSchedule(asset);
  const progress =
    asset.acquisition_amount > 0
      ? Math.round((asset.total_depreciated / asset.acquisition_amount) * 100)
      : 0;

  return (
    <div className="border-b last:border-b-0">
      <div
        className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-gray-50 transition-colors items-center text-sm cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="col-span-1">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="col-span-3 flex items-center gap-2">
          {getCategoryIcon(asset.asset_category)}
          <div>
            <p className="font-medium">{asset.label}</p>
            <p className="text-xs text-muted-foreground">
              {getCategoryLabel(asset.asset_category)} — {asset.pcg_account}
            </p>
          </div>
        </div>
        <div className="col-span-2 text-sm text-muted-foreground">
          {new Date(asset.acquisition_date).toLocaleDateString('fr-FR')}
        </div>
        <div className="col-span-2 text-right">
          <Money amount={asset.acquisition_amount} size="sm" />
        </div>
        <div className="col-span-2 text-right">
          <Money
            amount={asset.acquisition_amount - asset.total_depreciated}
            size="sm"
          />
        </div>
        <div className="col-span-1 text-right">
          <Badge
            variant={asset.status === 'active' ? 'default' : 'secondary'}
            className="text-[10px]"
          >
            {progress}%
          </Badge>
        </div>
        <div className="col-span-1 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onDelete(asset.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      {expanded && schedule.length > 0 && (
        <div className="bg-gray-50/50 px-10 py-3 border-t">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Plan d&apos;amortissement ({asset.depreciation_method},{' '}
            {asset.depreciation_duration_years} ans)
          </p>
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground border-b pb-1 mb-1">
            <div>Exercice</div>
            <div className="text-right">Dotation</div>
            <div className="text-right">Cumul</div>
            <div className="text-right">VNC</div>
          </div>
          {schedule.map(line => (
            <div
              key={line.fiscal_year}
              className="grid grid-cols-4 gap-2 text-xs py-1 border-b border-gray-100 last:border-0"
            >
              <div>{line.fiscal_year}</div>
              <div className="text-right">
                <Money amount={line.depreciation_amount} size="sm" />
              </div>
              <div className="text-right">
                <Money amount={line.cumulative_amount} size="sm" />
              </div>
              <div className="text-right">
                <Money amount={line.net_book_value} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddAssetDialog({
  onSubmit,
}: {
  onSubmit: (data: FixedAssetFormData) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const defaultForm: FixedAssetFormData = {
    label: '',
    asset_category: 'corporel',
    pcg_account: '218',
    acquisition_date: new Date().toISOString().split('T')[0],
    acquisition_amount: 0,
    depreciation_method: 'lineaire',
    depreciation_duration_years: 5,
  };
  const [form, setForm] = useState<FixedAssetFormData>(defaultForm);

  const handleSubmit = async () => {
    if (!form.label || !form.acquisition_amount) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      setOpen(false);
      setForm(defaultForm);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle immobilisation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une immobilisation</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Une immobilisation est un bien durable (+ de 500 € HT) que vous
            utilisez pendant plusieurs annees.
          </p>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Label>Designation *</Label>
            <Input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Ex: MacBook Pro 16 pouces"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Categorie</Label>
              <Select
                value={form.asset_category}
                onValueChange={v =>
                  setForm(f => ({
                    ...f,
                    asset_category: v as FixedAssetFormData['asset_category'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporel">
                    Corporel — biens physiques
                  </SelectItem>
                  <SelectItem value="incorporel">
                    Incorporel — logiciels, brevets
                  </SelectItem>
                  <SelectItem value="financier">
                    Financier — cautions, depots
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Compte PCG</Label>
              <Select
                value={form.pcg_account}
                onValueChange={v => setForm(f => ({ ...f, pcg_account: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PCG_IMMOBILISATION_ACCOUNTS.map(a => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code} — {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Date d&apos;acquisition *</Label>
              <Input
                type="date"
                value={form.acquisition_date}
                onChange={e =>
                  setForm(f => ({ ...f, acquisition_date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Montant HT *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.acquisition_amount || ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    acquisition_amount: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Fournisseur</Label>
              <Input
                value={form.supplier_name ?? ''}
                onChange={e =>
                  setForm(f => ({ ...f, supplier_name: e.target.value }))
                }
                placeholder="Ex: Apple Store"
              />
            </div>
            <div>
              <Label>N° facture</Label>
              <Input
                value={form.invoice_reference ?? ''}
                onChange={e =>
                  setForm(f => ({ ...f, invoice_reference: e.target.value }))
                }
                placeholder="Ex: FA-2025-001"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Mode amortissement</Label>
              <Select
                value={form.depreciation_method}
                onValueChange={v =>
                  setForm(f => ({
                    ...f,
                    depreciation_method: v as 'lineaire' | 'degressif',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lineaire">
                    Lineaire (recommande)
                  </SelectItem>
                  <SelectItem value="degressif">Degressif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duree (annees)</Label>
              <Select
                value={String(form.depreciation_duration_years)}
                onValueChange={v =>
                  setForm(f => ({
                    ...f,
                    depreciation_duration_years: parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">
                    3 ans — informatique, telephone
                  </SelectItem>
                  <SelectItem value="5">5 ans — vehicule, mobilier</SelectItem>
                  <SelectItem value="7">7 ans — agencements</SelectItem>
                  <SelectItem value="10">
                    10 ans — mobilier haute qualite
                  </SelectItem>
                  <SelectItem value="15">15 ans — installations</SelectItem>
                  <SelectItem value="20">20 ans — constructions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!form.label || !form.acquisition_amount || submitting}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
