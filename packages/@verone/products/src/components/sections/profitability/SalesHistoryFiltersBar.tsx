'use client';

/**
 * SalesHistoryFiltersBar — barre de filtres pour SalesHistoryTable.
 * Filtrage client-side : période, client, canal.
 *
 * Sprint : BO-PRODUCTS-PROFIT-004
 */

interface Props {
  periodFilter: string;
  clientFilter: string;
  channelFilter: string;
  availableYears: number[];
  clientOptions: string[];
  onPeriod: (v: string) => void;
  onClient: (v: string) => void;
  onChannel: (v: string) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export function SalesHistoryFiltersBar({
  periodFilter,
  clientFilter,
  channelFilter,
  availableYears,
  clientOptions,
  onPeriod,
  onClient,
  onChannel,
}: Props): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <select
        aria-label="Période"
        value={periodFilter}
        onChange={e => onPeriod(e.target.value)}
        className="h-11 md:h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="all">Toutes les périodes</option>
        <option value="12m">12 derniers mois</option>
        <option value="current_year">Année en cours ({CURRENT_YEAR})</option>
        {availableYears.map(y => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>

      <select
        aria-label="Client"
        value={clientFilter}
        onChange={e => onClient(e.target.value)}
        className="h-11 md:h-9 rounded-md border border-input bg-background px-2 text-sm min-w-[160px]"
      >
        <option value="">Tous les clients</option>
        {clientOptions.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        aria-label="Canal"
        value={channelFilter}
        onChange={e => onChannel(e.target.value)}
        className="h-11 md:h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="">Tous les canaux</option>
        <option value="manuel">Manuel</option>
        <option value="site_internet">Site</option>
        <option value="linkme">LinkMe</option>
      </select>
    </div>
  );
}
