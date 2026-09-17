'use client';

/**
 * Carte de réglage des coefficients conseillés — Famille / Catégorie / Sous-catégorie.
 *
 * Le coefficient multiplie le prix de revient pour proposer un prix de vente.
 * Un niveau laissé vide hérite du niveau au-dessus : sous-catégorie, puis
 * catégorie, puis famille, puis le repli général. C'est ce qui permet de ne
 * remplir que les branches qui se vendent réellement différemment.
 *
 * Volontairement dans `packages/@verone/` : un formulaire ne se crée pas dans
 * `apps/` (cf. `apps/back-office/CLAUDE.md`).
 *
 * Sprint BO-PRICING-GOV-001.
 */

import { useState } from 'react';

import { ButtonV2, Card, CardContent, Input, Label } from '@verone/ui';
import { Percent } from 'lucide-react';

/** Bornes miroir des contraintes CHECK en base (`*_coefficient_range`). */
export const COEFFICIENT_MIN = 1;
export const COEFFICIENT_MAX = 10;

export interface CoefficientsCardProps {
  /** Niveau réglé, pour le texte d'aide. */
  level: 'famille' | 'catégorie' | 'sous-catégorie';
  retailCoefficient: number | null;
  wholesaleCoefficient: number | null;
  /**
   * Ce qui s'applique aujourd'hui si les deux champs restent vides, et d'où ça
   * vient. Sert à montrer l'héritage plutôt qu'un champ vide muet.
   */
  inherited?: { retail: number; wholesale: number; from: string } | null;
  /** Enregistre les deux valeurs. `null` = vide, donc hériter. */
  onSave: (values: {
    retail_coefficient: number | null;
    wholesale_coefficient: number | null;
  }) => Promise<unknown>;
  disabled?: boolean;
}

/**
 * Lit un nombre écrit à la française ou à l'anglaise (« 2,5 » comme « 2.5 »).
 * Un champ `type="number"` aurait perdu la saisie à la virgule sans rien dire.
 */
function parseCoefficient(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  if (!/^\d*\.?\d*$/.test(cleaned) || !cleaned) return null;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function toField(value: number | null): string {
  return value === null || value === undefined ? '' : String(value);
}

export function CoefficientsCard({
  level,
  retailCoefficient,
  wholesaleCoefficient,
  inherited = null,
  onSave,
  disabled = false,
}: CoefficientsCardProps) {
  const [retail, setRetail] = useState(toField(retailCoefficient));
  const [wholesale, setWholesale] = useState(toField(wholesaleCoefficient));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  /** Retour visible après enregistrement, sans dépendre d'un système de notifications. */
  const [feedback, setFeedback] = useState<{
    tone: 'ok' | 'ko';
    text: string;
  } | null>(null);

  const isDirty =
    retail !== toField(retailCoefficient) ||
    wholesale !== toField(wholesaleCoefficient);

  const validate = (): {
    ok: boolean;
    retail: number | null;
    wholesale: number | null;
  } => {
    const next: Record<string, string> = {};

    const parse = (raw: string, key: string): number | null => {
      if (!raw.trim()) return null;
      const value = parseCoefficient(raw);
      if (value === null) {
        next[key] = 'Entrez un nombre, par exemple 2,5';
        return null;
      }
      if (value < COEFFICIENT_MIN || value > COEFFICIENT_MAX) {
        next[key] =
          `Le coefficient doit être compris entre ${COEFFICIENT_MIN} et ${COEFFICIENT_MAX}`;
        return null;
      }
      return value;
    };

    const retailValue = parse(retail, 'retail');
    const wholesaleValue = parse(wholesale, 'wholesale');

    if (
      !next.retail &&
      !next.wholesale &&
      retailValue !== null &&
      wholesaleValue !== null &&
      wholesaleValue >= retailValue
    ) {
      next.wholesale =
        'Le coefficient de gros doit rester sous celui de détail (LinkMe vend moins cher que le site)';
    }

    setErrors(next);
    return {
      ok: Object.keys(next).length === 0,
      retail: retailValue,
      wholesale: wholesaleValue,
    };
  };

  const handleSave = async () => {
    const result = validate();
    if (!result.ok) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      await onSave({
        retail_coefficient: result.retail,
        wholesale_coefficient: result.wholesale,
      });
      setFeedback({
        tone: 'ok',
        text:
          result.retail === null && result.wholesale === null
            ? `Enregistré. Cette ${level} hérite désormais du niveau au-dessus.`
            : 'Enregistré. Les prix conseillés du catalogue sont à jour.',
      });
    } catch (error) {
      console.error('[CoefficientsCard] Enregistrement échoué:', error);
      setFeedback({
        tone: 'ko',
        text:
          error instanceof Error
            ? error.message
            : "Les coefficients n'ont pas pu être enregistrés.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <Percent className="mt-1 h-5 w-5 shrink-0 text-black" />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-black">
              Coefficients conseillés
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Multiplient le prix de revient pour proposer un prix de vente.
              Laissez vide pour hériter du niveau au-dessus
              {inherited
                ? ` — aujourd'hui ${inherited.retail} au détail et ${inherited.wholesale} en gros, depuis ${inherited.from}.`
                : '.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="retail_coefficient" className="text-sm font-medium">
              Détail — site Vérone
            </Label>
            <Input
              id="retail_coefficient"
              type="text"
              inputMode="decimal"
              value={retail}
              disabled={disabled || isSaving}
              onChange={e => {
                setRetail(e.target.value);
                setFeedback(null);
                if (errors.retail) setErrors(prev => ({ ...prev, retail: '' }));
              }}
              placeholder={inherited ? String(inherited.retail) : '2,5'}
              className="w-full"
            />
            {errors.retail && (
              <p className="text-sm text-red-600">{errors.retail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="wholesale_coefficient"
              className="text-sm font-medium"
            >
              Gros — LinkMe
            </Label>
            <Input
              id="wholesale_coefficient"
              type="text"
              inputMode="decimal"
              value={wholesale}
              disabled={disabled || isSaving}
              onChange={e => {
                setWholesale(e.target.value);
                setFeedback(null);
                if (errors.wholesale)
                  setErrors(prev => ({ ...prev, wholesale: '' }));
              }}
              placeholder={inherited ? String(inherited.wholesale) : '1,7'}
              className="w-full"
            />
            {errors.wholesale && (
              <p className="text-sm text-red-600">{errors.wholesale}</p>
            )}
          </div>
        </div>

        {feedback && (
          <p
            className={
              feedback.tone === 'ok'
                ? 'text-sm text-green-700'
                : 'text-sm text-red-600'
            }
          >
            {feedback.text}
          </p>
        )}

        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          {isDirty && (
            <ButtonV2
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => {
                setRetail(toField(retailCoefficient));
                setWholesale(toField(wholesaleCoefficient));
                setErrors({});
              }}
              className="w-full md:w-auto"
            >
              Annuler
            </ButtonV2>
          )}
          <ButtonV2
            size="sm"
            disabled={disabled || isSaving || !isDirty}
            onClick={() => {
              void handleSave();
            }}
            className="w-full md:w-auto"
          >
            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </ButtonV2>
        </div>
      </CardContent>
    </Card>
  );
}
