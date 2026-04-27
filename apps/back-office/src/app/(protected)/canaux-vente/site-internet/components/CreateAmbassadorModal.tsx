'use client';

import { useState } from 'react';

import {
  ButtonV2,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@verone/ui';
import { Loader2, Search, UserPlus } from 'lucide-react';

import {
  useActivateExistingAsAmbassador,
  useCreateAmbassador,
  type ActivateExistingData,
  type CreateAmbassadorData,
} from '../hooks/use-ambassadors';

import { ActivateExistingForm } from './ActivateExistingForm';

// ============================================
// Props
// ============================================

interface CreateAmbassadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// Mode toggle tabs
// ============================================

type Mode = 'activate' | 'create';

function ModeTabs({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (m: Mode) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => onModeChange('activate')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          mode === 'activate'
            ? 'bg-foreground text-background'
            : 'bg-background text-muted-foreground hover:bg-muted'
        }`}
      >
        <Search className="h-3.5 w-3.5" />
        Client existant
      </button>
      <button
        type="button"
        onClick={() => onModeChange('create')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          mode === 'create'
            ? 'bg-foreground text-background'
            : 'bg-background text-muted-foreground hover:bg-muted'
        }`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        Nouveau client
      </button>
    </div>
  );
}

// ============================================
// Mode B — Nouveau client + ambassadeur
// ============================================

const EMPTY_CREATE: CreateAmbassadorData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  commission_rate: 10,
  discount_rate: 10,
  code: '',
  notes: '',
  iban: '',
  bic: '',
  bank_name: '',
  account_holder_name: '',
  siret: '',
};

function CreateNewForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: CreateAmbassadorData) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<CreateAmbassadorData>(EMPTY_CREATE);

  const set = <K extends keyof CreateAmbassadorData>(
    key: K,
    value: CreateAmbassadorData[K]
  ) => setForm(prev => ({ ...prev, [key]: value }));

  const generateCode = () => {
    const name = form.first_name.toUpperCase().replace(/\s/g, '').slice(0, 8);
    const rate = Math.round(form.discount_rate);
    set('code', `${name}${rate}`);
  };

  const isValid =
    form.first_name.length > 0 &&
    form.last_name.length > 0 &&
    form.email.includes('@') &&
    form.code.length >= 3;

  return (
    <>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="c_first_name">Prenom *</Label>
            <Input
              id="c_first_name"
              value={form.first_name}
              onChange={e => set('first_name', e.target.value)}
              placeholder="Marie"
            />
          </div>
          <div>
            <Label htmlFor="c_last_name">Nom *</Label>
            <Input
              id="c_last_name"
              value={form.last_name}
              onChange={e => set('last_name', e.target.value)}
              placeholder="Dupont"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="c_email">Email *</Label>
          <Input
            id="c_email"
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="marie@example.com"
          />
        </div>

        <div>
          <Label htmlFor="c_phone">Telephone</Label>
          <Input
            id="c_phone"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="06 12 34 56 78"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="c_discount">Reduction client (%)</Label>
            <Input
              id="c_discount"
              type="number"
              min={1}
              max={50}
              value={form.discount_rate}
              onChange={e => set('discount_rate', Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="c_commission">Prime ambassadeur (%)</Label>
            <Input
              id="c_commission"
              type="number"
              min={1}
              max={50}
              value={form.commission_rate}
              onChange={e => set('commission_rate', Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="c_code">Code promo *</Label>
          <div className="flex gap-2">
            <Input
              id="c_code"
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              placeholder="MARIE10"
              className="uppercase"
            />
            <ButtonV2
              type="button"
              variant="outline"
              size="sm"
              onClick={generateCode}
              disabled={!form.first_name}
            >
              Generer
            </ButtonV2>
          </div>
        </div>

        <details className="border rounded-lg p-3">
          <summary className="text-sm font-medium cursor-pointer">
            Coordonnees bancaires (optionnel)
          </summary>
          <div className="space-y-3 mt-3">
            <div>
              <Label htmlFor="c_holder">Titulaire</Label>
              <Input
                id="c_holder"
                value={form.account_holder_name}
                onChange={e => set('account_holder_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c_iban">IBAN</Label>
              <Input
                id="c_iban"
                value={form.iban}
                onChange={e => set('iban', e.target.value)}
                placeholder="FR76 ..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="c_bic">BIC</Label>
                <Input
                  id="c_bic"
                  value={form.bic}
                  onChange={e => set('bic', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c_bank">Banque</Label>
                <Input
                  id="c_bank"
                  value={form.bank_name}
                  onChange={e => set('bank_name', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="c_siret">SIRET (si &gt; 305 EUR/an)</Label>
              <Input
                id="c_siret"
                value={form.siret}
                onChange={e => set('siret', e.target.value)}
                placeholder="123 456 789 00012"
              />
            </div>
          </div>
        </details>

        <div>
          <Label htmlFor="c_notes">Notes internes</Label>
          <Textarea
            id="c_notes"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Influenceuse deco, 15K followers..."
            rows={2}
          />
        </div>
      </div>

      <DialogFooter className="flex-col gap-2 md:flex-row">
        <ButtonV2
          className="w-full md:w-auto"
          onClick={() => {
            if (isValid) onSubmit(form);
          }}
          disabled={!isValid || isPending}
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Creer l&apos;ambassadeur
        </ButtonV2>
      </DialogFooter>
    </>
  );
}

// ============================================
// Main modal
// ============================================

export function CreateAmbassadorModal({
  open,
  onOpenChange,
}: CreateAmbassadorModalProps) {
  const [mode, setMode] = useState<Mode>('activate');

  const createMutation = useCreateAmbassador();
  const activateMutation = useActivateExistingAsAmbassador();

  const isPending = createMutation.isPending || activateMutation.isPending;

  const handleCreate = (data: CreateAmbassadorData) => {
    void createMutation
      .mutateAsync(data)
      .then(() => {
        onOpenChange(false);
        setMode('activate');
      })
      .catch((err: unknown) => {
        console.error('[CreateAmbassadorModal] create failed:', err);
      });
  };

  const handleActivate = (data: ActivateExistingData) => {
    void activateMutation
      .mutateAsync(data)
      .then(() => {
        onOpenChange(false);
        setMode('activate');
      })
      .catch((err: unknown) => {
        console.error('[CreateAmbassadorModal] activate failed:', err);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-lg md:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel ambassadeur</DialogTitle>
          <DialogDescription>
            Activez un client existant ou créez un nouveau compte ambassadeur.
          </DialogDescription>
        </DialogHeader>

        <ModeTabs mode={mode} onModeChange={setMode} />

        {mode === 'activate' ? (
          <ActivateExistingForm
            onSubmit={handleActivate}
            isPending={isPending}
            onCancel={() => onOpenChange(false)}
          />
        ) : (
          <CreateNewForm onSubmit={handleCreate} isPending={isPending} />
        )}
      </DialogContent>
    </Dialog>
  );
}
