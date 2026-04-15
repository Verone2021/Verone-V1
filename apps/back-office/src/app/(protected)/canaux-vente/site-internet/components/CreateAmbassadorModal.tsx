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
import { Loader2 } from 'lucide-react';

import {
  useCreateAmbassador,
  type CreateAmbassadorData,
} from '../hooks/use-ambassadors';

interface CreateAmbassadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAmbassadorModal({
  open,
  onOpenChange,
}: CreateAmbassadorModalProps) {
  const createMutation = useCreateAmbassador();

  const [form, setForm] = useState<CreateAmbassadorData>({
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
  });

  const updateField = <K extends keyof CreateAmbassadorData>(
    key: K,
    value: CreateAmbassadorData[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const generateCode = () => {
    const name = form.first_name.toUpperCase().replace(/\s/g, '').slice(0, 8);
    const rate = Math.round(form.discount_rate);
    updateField('code', `${name}${rate}`);
  };

  const handleSubmit = () => {
    if (!form.first_name || !form.last_name || !form.email || !form.code) {
      return;
    }
    void createMutation
      .mutateAsync(form)
      .then(() => {
        onOpenChange(false);
        setForm({
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
        });
      })
      .catch((error: unknown) => {
        console.error('[CreateAmbassador] Mutation failed:', error);
      });
  };

  const isValid =
    form.first_name.length > 0 &&
    form.last_name.length > 0 &&
    form.email.includes('@') &&
    form.code.length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel ambassadeur</DialogTitle>
          <DialogDescription>
            Creer un ambassadeur avec un code promo unique et un QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Identite */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">Prenom *</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={e => updateField('first_name', e.target.value)}
                placeholder="Marie"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={e => updateField('last_name', e.target.value)}
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              placeholder="marie@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telephone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>

          {/* Taux */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="discount_rate">Reduction client (%)</Label>
              <Input
                id="discount_rate"
                type="number"
                min={1}
                max={50}
                value={form.discount_rate}
                onChange={e =>
                  updateField('discount_rate', Number(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Reduction appliquee au client
              </p>
            </div>
            <div>
              <Label htmlFor="commission_rate">Prime ambassadeur (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                min={1}
                max={50}
                value={form.commission_rate}
                onChange={e =>
                  updateField('commission_rate', Number(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Prime sur le montant HT de la vente
              </p>
            </div>
          </div>

          {/* Code promo */}
          <div>
            <Label htmlFor="code">Code promo *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={form.code}
                onChange={e =>
                  updateField('code', e.target.value.toUpperCase())
                }
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
            <p className="text-xs text-muted-foreground mt-1">
              Le client saisit ce code au checkout pour beneficier de la
              reduction
            </p>
          </div>

          {/* Coordonnees bancaires (optionnel) */}
          <details className="border rounded-lg p-3">
            <summary className="text-sm font-medium cursor-pointer">
              Coordonnees bancaires (optionnel)
            </summary>
            <div className="space-y-3 mt-3">
              <div>
                <Label htmlFor="account_holder_name">Titulaire du compte</Label>
                <Input
                  id="account_holder_name"
                  value={form.account_holder_name}
                  onChange={e =>
                    updateField('account_holder_name', e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={form.iban}
                  onChange={e => updateField('iban', e.target.value)}
                  placeholder="FR76 ..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bic">BIC</Label>
                  <Input
                    id="bic"
                    value={form.bic}
                    onChange={e => updateField('bic', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bank_name">Banque</Label>
                  <Input
                    id="bank_name"
                    value={form.bank_name}
                    onChange={e => updateField('bank_name', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="siret">SIRET (si &gt; 305 EUR/an)</Label>
                <Input
                  id="siret"
                  value={form.siret}
                  onChange={e => updateField('siret', e.target.value)}
                  placeholder="123 456 789 00012"
                />
              </div>
            </div>
          </details>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Influenceuse deco, 15K followers Instagram..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <ButtonV2 variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={handleSubmit}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Creer l&apos;ambassadeur
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
