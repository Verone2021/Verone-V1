'use client';

import { useCallback, useState } from 'react';

import { ButtonV2, Input, Label } from '@verone/ui';
import { Loader2, X } from 'lucide-react';

import { createClient } from '@verone/utils/supabase/client';

import type { ActivateExistingData } from '../hooks/use-ambassadors';

// ============================================
// Customer search result
// ============================================

interface CustomerResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

// ============================================
// ActivateExistingForm
// ============================================

interface ActivateExistingFormProps {
  onSubmit: (data: ActivateExistingData) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function ActivateExistingForm({
  onSubmit,
  isPending,
  onCancel,
}: ActivateExistingFormProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CustomerResult | null>(null);

  const [form, setForm] = useState({
    commission_rate: 10,
    discount_rate: 10,
    code: '',
    iban: '',
    bic: '',
    bank_name: '',
    account_holder_name: '',
    siret: '',
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('individual_customers')
      .select('id, first_name, last_name, email, phone')
      .or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .eq('is_ambassador' as never, false as never)
      .eq('is_active', true)
      .limit(6);
    setResults((data as CustomerResult[]) ?? []);
    setSearching(false);
  }, []);

  const generateCode = () => {
    if (!selected) return;
    const name = selected.first_name
      .toUpperCase()
      .replace(/\s/g, '')
      .slice(0, 8);
    const rate = Math.round(form.discount_rate);
    set('code', `${name}${rate}`);
  };

  const isValid =
    selected !== null &&
    form.code.length >= 3 &&
    form.commission_rate > 0 &&
    form.discount_rate > 0;

  return (
    <>
      <div className="space-y-4 py-4">
        {/* Recherche client */}
        {!selected ? (
          <div>
            <Label htmlFor="a_search">Rechercher un client *</Label>
            <div className="relative">
              <Input
                id="a_search"
                value={search}
                onChange={e => {
                  void handleSearch(e.target.value);
                }}
                placeholder="Email, prénom ou nom..."
                className="pr-8"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {results.length > 0 && (
              <div className="mt-1 border rounded-lg overflow-hidden divide-y">
                {results.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      setSearch('');
                      setResults([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Seuls les clients non-ambassadeurs et actifs apparaissent.
            </p>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">
                {selected.first_name} {selected.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{selected.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="p-1 hover:bg-muted-foreground/20 rounded"
              title="Changer de client"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Taux */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="a_discount">Reduction client (%)</Label>
            <Input
              id="a_discount"
              type="number"
              min={1}
              max={50}
              value={form.discount_rate}
              onChange={e => set('discount_rate', Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="a_commission">Prime ambassadeur (%)</Label>
            <Input
              id="a_commission"
              type="number"
              min={1}
              max={50}
              value={form.commission_rate}
              onChange={e => set('commission_rate', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Code promo */}
        <div>
          <Label htmlFor="a_code">Code promo *</Label>
          <div className="flex gap-2">
            <Input
              id="a_code"
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
              disabled={!selected}
            >
              Generer
            </ButtonV2>
          </div>
        </div>

        {/* Coordonnees bancaires */}
        <details className="border rounded-lg p-3">
          <summary className="text-sm font-medium cursor-pointer">
            Coordonnees bancaires (optionnel)
          </summary>
          <div className="space-y-3 mt-3">
            <div>
              <Label htmlFor="a_holder">Titulaire</Label>
              <Input
                id="a_holder"
                value={form.account_holder_name}
                onChange={e => set('account_holder_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="a_iban">IBAN</Label>
              <Input
                id="a_iban"
                value={form.iban}
                onChange={e => set('iban', e.target.value)}
                placeholder="FR76 ..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="a_bic">BIC</Label>
                <Input
                  id="a_bic"
                  value={form.bic}
                  onChange={e => set('bic', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="a_bank">Banque</Label>
                <Input
                  id="a_bank"
                  value={form.bank_name}
                  onChange={e => set('bank_name', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="a_siret">SIRET (si &gt; 305 EUR/an)</Label>
              <Input
                id="a_siret"
                value={form.siret}
                onChange={e => set('siret', e.target.value)}
                placeholder="123 456 789 00012"
              />
            </div>
          </div>
        </details>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
        <ButtonV2
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Annuler
        </ButtonV2>
        <ButtonV2
          className="w-full sm:w-auto"
          onClick={() => {
            if (!isValid || !selected) return;
            onSubmit({
              customer_id: selected.id,
              commission_rate: form.commission_rate,
              discount_rate: form.discount_rate,
              code: form.code,
              iban: form.iban,
              bic: form.bic,
              bank_name: form.bank_name,
              account_holder_name: form.account_holder_name,
              siret: form.siret,
            });
          }}
          disabled={!isValid || isPending}
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Activer comme ambassadeur
        </ButtonV2>
      </div>
    </>
  );
}
