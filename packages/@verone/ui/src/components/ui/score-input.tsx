'use client';

import * as React from 'react';

import { cn } from '@verone/utils';
import { Star } from 'lucide-react';

export interface ScoreInputProps {
  /** Libellé lu par les lecteurs d'écran et affiché au-dessus si `showLabel` */
  label: string;
  /** Note de 1 à `max`, ou null si non notée */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Nombre d'étoiles (5 par défaut) */
  max?: number;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

/**
 * ScoreInput - note de 1 à 5 en étoiles, utilisable au clavier et au doigt.
 *
 * - Groupe de boutons radio (flèches gauche / droite, Début / Fin)
 * - Cible tactile 44 px sur mobile, 36 px à partir de md
 * - Recliquer sur la note choisie l'efface (retour à « non notée »)
 *
 * @example
 * <ScoreInput label="Emballage" value={score} onChange={setScore} />
 */
export function ScoreInput({
  label,
  value,
  onChange,
  max = 5,
  disabled = false,
  showLabel = true,
  className,
}: ScoreInputProps) {
  const labelId = React.useId();
  const buttonsRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const scores = Array.from({ length: max }, (_, index) => index + 1);
  // Élément atteignable par Tab : la note choisie, sinon la première étoile
  const focusableScore = value ?? 1;

  const select = (score: number | null) => {
    if (disabled) return;
    onChange(score);
    const target = score ?? 1;
    buttonsRef.current[target - 1]?.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    score: number
  ) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        select(Math.min(max, score + 1));
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        select(Math.max(1, score - 1));
        break;
      case 'Home':
        event.preventDefault();
        select(1);
        break;
      case 'End':
        event.preventDefault();
        select(max);
        break;
      case 'Backspace':
      case 'Delete':
        event.preventDefault();
        select(null);
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <p id={labelId} className="text-sm font-medium text-gray-900">
          {label}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label={showLabel ? undefined : label}
          aria-labelledby={showLabel ? labelId : undefined}
          aria-disabled={disabled || undefined}
          className="flex items-center"
        >
          {scores.map(score => {
            const filled = value !== null && score <= value;
            const checked = value === score;
            return (
              <button
                key={score}
                ref={element => {
                  buttonsRef.current[score - 1] = element;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={`${score} sur ${max}`}
                tabIndex={score === focusableScore ? 0 : -1}
                disabled={disabled}
                onClick={() => select(checked ? null : score)}
                onKeyDown={event => handleKeyDown(event, score)}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-md transition-colors md:h-9 md:w-9',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black',
                  disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-gray-100'
                )}
              >
                <Star
                  aria-hidden="true"
                  className={cn(
                    'h-5 w-5',
                    filled ? 'fill-amber-400 text-amber-500' : 'text-gray-300'
                  )}
                />
              </button>
            );
          })}
        </div>
        <span className="text-sm text-gray-600" aria-live="polite">
          {value === null ? 'Non noté' : `${value}/${max}`}
        </span>
      </div>
    </div>
  );
}
