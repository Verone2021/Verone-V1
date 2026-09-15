'use client';

interface ProfitabilityTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

/** Tuile d'indicateur partagée par les blocs de rentabilité */
export function ProfitabilityTile({
  label,
  value,
  sub,
}: ProfitabilityTileProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-0.5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-900">{value}</p>
      {sub && <p className="text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}
