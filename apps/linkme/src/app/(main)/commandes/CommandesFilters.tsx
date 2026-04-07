'use client';

import { Calendar } from 'lucide-react';

import {
  YEAR_OPTIONS,
  PERIOD_OPTIONS,
  OWNERSHIP_TYPE_OPTIONS,
} from './commandes.constants';

interface CommandesFiltersProps {
  yearFilter: string;
  periodFilter: string;
  ownershipTypeFilter: string;
  onYearChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onPeriodChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onOwnershipTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SELECT_CLASS =
  'text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5DBEBB] focus:border-[#5DBEBB]';

export function CommandesFilters({
  yearFilter,
  periodFilter,
  ownershipTypeFilter,
  onYearChange,
  onPeriodChange,
  onOwnershipTypeChange,
}: CommandesFiltersProps) {
  return (
    <div className="flex items-center justify-end gap-3 flex-wrap">
      <select
        value={ownershipTypeFilter}
        onChange={onOwnershipTypeChange}
        className={SELECT_CLASS}
      >
        {OWNERSHIP_TYPE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <select
          value={yearFilter}
          onChange={onYearChange}
          className={SELECT_CLASS}
        >
          {YEAR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <select
        value={periodFilter}
        onChange={onPeriodChange}
        disabled={yearFilter === 'all'}
        className={`${SELECT_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {PERIOD_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
