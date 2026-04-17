'use client';

import { AlertTriangle } from 'lucide-react';

import { Badge, cn } from '@verone/ui';

/**
 * Helper pur — testable sans contexte React.
 * Retourne true si l'écart entre total DB (euros) et total Qonto (cents)
 * dépasse le seuil (défaut 0.01 €).
 */
export function hasTotalDiscordance(
  localTotalTtcEuros: number | null | undefined,
  qontoTotalCents: number | null | undefined,
  threshold = 0.01
): boolean {
  if (localTotalTtcEuros == null || qontoTotalCents == null) return false;
  return Math.abs(localTotalTtcEuros - qontoTotalCents / 100) > threshold;
}

interface DocumentDiscordanceBadgeProps {
  localTotalTtcEuros: number | null | undefined;
  qontoTotalCents: number | null | undefined;
  className?: string;
}

/**
 * Pastille orange affichée uniquement lorsque le total_ttc DB
 * s'écarte du total_amount_cents Qonto de plus de 0.01 €.
 */
export function DocumentDiscordanceBadge({
  localTotalTtcEuros,
  qontoTotalCents,
  className,
}: DocumentDiscordanceBadgeProps): React.ReactNode {
  if (!hasTotalDiscordance(localTotalTtcEuros, qontoTotalCents)) return null;

  const diff = (
    (localTotalTtcEuros ?? 0) -
    (qontoTotalCents ?? 0) / 100
  ).toFixed(2);
  const dbFormatted = (localTotalTtcEuros ?? 0).toFixed(2);
  const qontoFormatted = ((qontoTotalCents ?? 0) / 100).toFixed(2);

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-orange-50 text-orange-700 border-orange-200 gap-1',
        className
      )}
      title={`Discordance total DB vs Qonto : ${diff}€ (DB ${dbFormatted}€ vs Qonto ${qontoFormatted}€)`}
    >
      <AlertTriangle className="h-3 w-3" />
      Discordance
    </Badge>
  );
}
