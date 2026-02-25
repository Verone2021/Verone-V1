'use client';

/**
 * OnboardingChecklist - Checklist d'onboarding pour le dashboard LinkMe
 *
 * Affiche une checklist de 7 étapes avec progression visuelle.
 * Visible tant que l'onboarding n'est pas complété ou masqué.
 * Auto-détecte les étapes complétées + permet de masquer.
 *
 * Pattern Notion/Linear : +40-70% rétention selon études B2B SaaS.
 *
 * @module OnboardingChecklist
 * @since 2026-02-26
 */

import Link from 'next/link';

import {
  CheckCircle2,
  Circle,
  ArrowRight,
  X,
  Rocket,
  Sparkles,
} from 'lucide-react';

import {
  useOnboardingProgress,
  type OnboardingStep,
} from '../../lib/hooks/use-onboarding-progress';
import { cn } from '../../lib/utils';

// ─── Step Item ──────────────────────────────────────────────────────────────

function StepItem({ step }: { step: OnboardingStep }): JSX.Element {
  return (
    <Link
      href={step.href}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all group',
        step.completed
          ? 'bg-green-50/50'
          : 'hover:bg-linkme-turquoise/5 cursor-pointer'
      )}
    >
      {step.completed ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
      ) : (
        <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 group-hover:text-linkme-turquoise transition-colors" />
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            step.completed
              ? 'text-green-700 line-through'
              : 'text-linkme-marine'
          )}
        >
          {step.label}
        </p>
        {!step.completed && (
          <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
        )}
      </div>

      {!step.completed && (
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-linkme-turquoise flex-shrink-0 transition-colors" />
      )}
    </Link>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

function ProgressBar({
  percentage,
  completedCount,
  totalCount,
}: {
  percentage: number;
  completedCount: number;
  totalCount: number;
}): JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-linkme-marine">
          {completedCount}/{totalCount} complétées
        </span>
        <span className="text-linkme-turquoise font-semibold">
          {percentage}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-linkme-turquoise to-linkme-turquoise/80 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─── Composant Principal ────────────────────────────────────────────────────

export function OnboardingChecklist(): JSX.Element | null {
  const {
    steps,
    completedCount,
    totalCount,
    percentage,
    isDismissed,
    isFullyCompleted,
    isLoading,
    dismissChecklist,
  } = useOnboardingProgress();

  // Ne pas afficher si masqué, complété, ou en chargement
  if (isLoading || isDismissed) return null;

  // Message de félicitations si complété
  if (isFullyCompleted) {
    return (
      <section className="bg-gradient-to-br from-green-50 to-linkme-turquoise/5 rounded-2xl border border-green-100 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">
                Bravo, onboarding terminé !
              </p>
              <p className="text-sm text-green-600">
                Vous maîtrisez LinkMe. Bonne continuation !
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissChecklist}
            className="p-1.5 rounded-lg hover:bg-green-100 text-green-400 hover:text-green-600 transition-colors"
            aria-label="Masquer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linkme-turquoise/10">
              <Rocket className="h-5 w-5 text-linkme-turquoise" />
            </div>
            <div>
              <h2 className="font-semibold text-linkme-marine">
                Démarrer avec LinkMe
              </h2>
              <p className="text-xs text-gray-500">
                Complétez ces étapes pour tirer le meilleur parti de la
                plateforme
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissChecklist}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Masquer la checklist"
            title="Masquer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Barre de progression */}
        <ProgressBar
          percentage={percentage}
          completedCount={completedCount}
          totalCount={totalCount}
        />
      </div>

      {/* Liste des étapes */}
      <div className="p-3 pt-2">
        {steps.map(step => (
          <StepItem key={step.id} step={step} />
        ))}
      </div>

      {/* Lien aide */}
      <div className="px-5 pb-4 pt-1">
        <Link
          href="/aide/demarrer"
          className="text-xs text-gray-400 hover:text-linkme-turquoise transition-colors"
        >
          Besoin d&apos;aide ? Consultez le guide complet
        </Link>
      </div>
    </section>
  );
}
