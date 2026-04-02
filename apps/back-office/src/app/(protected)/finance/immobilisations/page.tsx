/* eslint-disable max-lines */
'use client';

import { useState } from 'react';

import {
  useFixedAssets,
  PCG_IMMOBILISATION_ACCOUNTS,
  computeDepreciationSchedule,
  type FixedAsset,
  type FixedAssetFormData,
} from '@verone/finance';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Badge,
} from '@verone/ui';
import { KpiCard, KpiGrid, Money } from '@verone/ui-business';
import {
  Plus,
  Building2,
  Monitor,
  Landmark,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'incorporel':
      return <Landmark className="h-4 w-4" />;
    case 'financier':
      return <Building2 className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

function getCategoryLabel(cat: string) {
  switch (cat) {
    case 'incorporel':
      return 'Incorporel';
    case 'financier':
      return 'Financier';
    default:
      return 'Corporel';
  }
}

function AssetRow({
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

function AddAssetDialog({
  onSubmit,
}: {
  onSubmit: (data: FixedAssetFormData) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FixedAssetFormData>({
    label: '',
    asset_category: 'corporel',
    pcg_account: '218',
    acquisition_date: new Date().toISOString().split('T')[0],
    acquisition_amount: 0,
    depreciation_method: 'lineaire',
    depreciation_duration_years: 5,
  });

  const handleSubmit = async () => {
    if (!form.label || !form.acquisition_amount) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      setOpen(false);
      setForm({
        label: '',
        asset_category: 'corporel',
        pcg_account: '218',
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_amount: 0,
        depreciation_method: 'lineaire',
        depreciation_duration_years: 5,
      });
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
            utilisez pendant plusieurs annees. Son cout est reparti sur sa duree
            de vie (amortissement).
          </p>
        </DialogHeader>
        <div className="space-y-5">
          {/* Designation */}
          <div>
            <Label>Designation *</Label>
            <Input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Ex: MacBook Pro 16 pouces"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nom du bien tel qu&apos;il apparait sur la facture d&apos;achat.
            </p>
          </div>

          {/* Catégorie + Compte PCG */}
          <div className="grid grid-cols-2 gap-3">
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
              <p className="text-xs text-muted-foreground mt-1">
                {form.asset_category === 'corporel' &&
                  'Meubles, ordinateurs, vehicules, outillage, agencements...'}
                {form.asset_category === 'incorporel' &&
                  'Logiciels, licences, site web, fonds de commerce, brevets...'}
                {form.asset_category === 'financier' &&
                  'Depot de garantie (bail), caution, titres de participation...'}
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {form.pcg_account === '205' &&
                  'Logiciels achetes, brevets, licences'}
                {form.pcg_account === '207' &&
                  'Fonds de commerce, droit au bail'}
                {form.pcg_account === '211' && 'Terrain (non amortissable)'}
                {form.pcg_account === '213' && 'Batiment, local commercial'}
                {form.pcg_account === '215' &&
                  'Machines, outillage, equipement pro'}
                {form.pcg_account === '218' &&
                  'Ordinateurs, meubles, vehicules, telephone — le plus courant'}
                {form.pcg_account === '261' && 'Parts dans une autre societe'}
                {form.pcg_account === '275' &&
                  'Depot de garantie du bail, caution'}
              </p>
            </div>
          </div>

          {/* Guide rapide */}
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">
              Guide rapide — Quel compte choisir ?
            </p>
            <ul className="space-y-0.5">
              <li>
                Ordinateur, telephone, tablette → <strong>218</strong> (3 ans)
              </li>
              <li>
                Mobilier, decoration showroom → <strong>218</strong> (5-10 ans)
              </li>
              <li>
                Vehicule de societe → <strong>218</strong> (4-5 ans)
              </li>
              <li>
                Logiciel, site web → <strong>205</strong> (3 ans)
              </li>
              <li>
                Depot de garantie bail → <strong>275</strong> (pas
                d&apos;amortissement)
              </li>
              <li>
                Machine, outil professionnel → <strong>215</strong> (5-7 ans)
              </li>
            </ul>
          </div>

          {/* Date + Montant */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date d&apos;acquisition *</Label>
              <Input
                type="date"
                value={form.acquisition_date}
                onChange={e =>
                  setForm(f => ({ ...f, acquisition_date: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Date de la facture d&apos;achat (ou livraison).
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Prix hors taxes. Seuil : 500 € HT minimum pour immobiliser.
              </p>
            </div>
          </div>

          {/* Fournisseur + Facture */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* Mode amortissement + Durée */}
          <div className="grid grid-cols-2 gap-3">
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
              <p className="text-xs text-muted-foreground mt-1">
                {form.depreciation_method === 'lineaire'
                  ? 'Meme montant chaque annee. Le plus simple et le plus courant.'
                  : 'Plus au debut, moins a la fin. Reserve au materiel industriel.'}
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Duree d&apos;usage fiscalement admise. En cas de doute,
                choisissez 5 ans.
              </p>
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

export default function ImmobilisationsPage() {
  const { assets, isLoading, error, stats, createAsset, deleteAsset } =
    useFixedAssets();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Immobilisations</h1>
          <p className="text-sm text-muted-foreground">
            Actifs amortissables — PCG classes 20-21
          </p>
        </div>
        <AddAssetDialog onSubmit={createAsset} />
      </div>

      <KpiGrid columns={4}>
        <KpiCard
          title="Valeur brute"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          }).format(stats.totalBrut)}
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiCard
          title="Amortissements cumules"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          }).format(stats.totalAmort)}
          icon={<Monitor className="h-4 w-4" />}
        />
        <KpiCard
          title="Valeur nette comptable"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          }).format(stats.totalNet)}
          icon={<Landmark className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          title="Actifs en cours"
          value={stats.activeCount}
          valueType="number"
        />
      </KpiGrid>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Chargement...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-red-700">{error}</CardContent>
        </Card>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Aucune immobilisation enregistree</p>
            <p className="text-xs mt-1">
              Ajoutez vos actifs amortissables (materiel, vehicules, logiciels,
              etc.)
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">
              {assets.length} immobilisation{assets.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="border-t">
              <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-xs font-medium text-muted-foreground bg-gray-50 border-b">
                <div className="col-span-1" />
                <div className="col-span-3">Designation</div>
                <div className="col-span-2">Date acquisition</div>
                <div className="col-span-2 text-right">Brut HT</div>
                <div className="col-span-2 text-right">VNC</div>
                <div className="col-span-1 text-right">Amorti</div>
                <div className="col-span-1" />
              </div>
              {assets.map(asset => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  onDelete={(id: string) => {
                    void deleteAsset(id);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
