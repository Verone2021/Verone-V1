'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import { Input } from '@verone/ui/components/ui/input';
import { Check, Pencil, Target, X } from 'lucide-react';

export interface SourcingTargetPriceFieldProps {
  targetPrice: number | null;
  /** Meilleur coût rendu connu, pour situer la cible face au réel. */
  bestLandedCost?: number | null;
  saving?: boolean;
  onSave: (targetPrice: number | null) => Promise<boolean>;
}

function euros(value: number): string {
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

/**
 * Prix d'achat visé — [BO-SOURCING-OFFRES-004]
 *
 * Le repère de toute la négociation : sans lui, l'écart affiché sur chaque
 * offre n'existe pas. Il était lisible sur la fiche sourcing mais modifiable
 * uniquement depuis le catalogue et l'extension Chrome.
 */
export function SourcingTargetPriceField({
  targetPrice,
  bestLandedCost = null,
  saving = false,
  onSave,
}: SourcingTargetPriceFieldProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const start = () => {
    setValue(targetPrice != null ? String(targetPrice) : '');
    setEditing(true);
  };

  const submit = () => {
    const trimmed = value.trim();
    const parsed =
      trimmed === '' ? null : Number.parseFloat(trimmed.replace(',', '.'));
    if (parsed !== null && (!Number.isFinite(parsed) || parsed <= 0)) return;
    void onSave(parsed)
      .then(ok => {
        if (ok) setEditing(false);
      })
      .catch((error: unknown) => {
        console.error('[SourcingTargetPriceField] enregistrement:', error);
      });
  };

  const ecart =
    targetPrice != null && bestLandedCost != null
      ? bestLandedCost - targetPrice
      : null;

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Target className="h-4 w-4 shrink-0 text-gray-400" />
        <Input
          type="number"
          step="0.01"
          min="0"
          autoFocus
          className="h-11 w-32 md:h-9"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') setEditing(false);
          }}
          placeholder="Prix cible"
          aria-label="Prix d’achat visé en euros"
        />
        <ButtonV2
          variant="primary"
          size="sm"
          icon={Check}
          onClick={submit}
          disabled={saving}
          aria-label="Enregistrer le prix cible"
          className="h-11 w-11 md:h-9 md:w-9"
        />
        <ButtonV2
          variant="ghost"
          size="sm"
          icon={X}
          onClick={() => setEditing(false)}
          disabled={saving}
          aria-label="Annuler"
          className="h-11 w-11 md:h-9 md:w-9"
        />
        <span className="text-xs text-gray-500">
          Vider le champ enlève la cible.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Target className="h-4 w-4 shrink-0 text-gray-400" />
      <span className="text-gray-600">Prix cible :</span>
      <span className="font-medium text-black">
        {targetPrice != null ? euros(targetPrice) : 'non défini'}
      </span>
      {ecart !== null && (
        <span
          className={
            ecart > 0 ? 'text-xs text-red-600' : 'text-xs text-green-600'
          }
        >
          meilleure offre {ecart > 0 ? '+' : ''}
          {euros(ecart)} par rapport à la cible
        </span>
      )}
      <ButtonV2
        variant="ghost"
        size="sm"
        icon={Pencil}
        onClick={start}
        aria-label="Modifier le prix cible"
        className="h-11 w-11 md:h-9 md:w-9"
      />
    </div>
  );
}
