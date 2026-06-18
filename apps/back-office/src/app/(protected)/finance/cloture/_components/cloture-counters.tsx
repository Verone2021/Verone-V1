'use client';

/**
 * Barre de compteurs en tête de la page clôture [BO-COMPTA-001]
 * Présentes / Manquantes / À compléter / Transférées
 */

import { AlertCircle, CheckCircle2, ClipboardList, Send } from 'lucide-react';

import type { ClotureCounters } from '../types';

interface ClotureCounterBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}

function CounterBadge({
  icon,
  label,
  value,
  colorClass,
}: ClotureCounterBadgeProps) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${colorClass}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

interface ClotureCountersBarProps {
  counters: ClotureCounters;
  isLoading?: boolean;
}

export function ClotureCountersBar({
  counters,
  isLoading,
}: ClotureCountersBarProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 flex-wrap">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-14 w-36 rounded-lg border bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <CounterBadge
        icon={<ClipboardList className="h-5 w-5 text-slate-500" />}
        label="Pièces présentes"
        value={counters.present}
        colorClass="bg-white border-slate-200"
      />
      <CounterBadge
        icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
        label="Pièces manquantes"
        value={counters.missing}
        colorClass="bg-amber-50 border-amber-200"
      />
      <CounterBadge
        icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
        label="À compléter (TVA/PCG)"
        value={counters.toComplete}
        colorClass="bg-orange-50 border-orange-200"
      />
      <CounterBadge
        icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        label="Transférées au comptable"
        value={counters.transferred}
        colorClass="bg-green-50 border-green-200"
      />
      <CounterBadge
        icon={<Send className="h-5 w-5 text-slate-400" />}
        label="Total lignes"
        value={counters.total}
        colorClass="bg-slate-50 border-slate-200"
      />
    </div>
  );
}
