'use client';

/**
 * Page de clôture comptable [BO-COMPTA-001]
 *
 * Écran unique permettant à Roméo de, pour une année donnée :
 * - Voir toutes les pièces présentes ET manquantes (achats / ventes / avoirs)
 * - Repérer les signaux : pièce manquante, TVA à vérifier, PCG absent
 * - Déposer une pièce, corriger TVA + code comptable
 * - Récupérer les pièces depuis Qonto d'un coup
 * - Préparer le plan d'envoi Welyb (dry-run, sans envoi réel)
 * - Voir le statut « transféré au comptable »
 *
 * Architecture desktop-first (page admin — cf. .claude/rules/responsive.md)
 */

import { useCallback, useState } from 'react';

import {
  Input,
  ResponsiveToolbar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@verone/ui';
import { FileArchive, Search } from 'lucide-react';

import { ClotureCountersBar } from '../_shared-comptable/cloture-counters';
import { ClotureGlobalActions } from '../_shared-comptable/cloture-global-actions';
import { ClotureTable } from './_components/cloture-table';
import { useClotureData } from '../_shared-comptable/use-cloture-data';
import type { ClotureCategory } from '../_shared-comptable/types';

// ── Constantes ────────────────────────────────────────────────────────────────

const AVAILABLE_YEARS = Array.from(
  { length: new Date().getFullYear() - 2022 + 1 },
  (_, i) => new Date().getFullYear() - i
);

const MONTH_LABELS = [
  { value: 'all', label: 'Tous les mois' },
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

const CATEGORY_OPTIONS: { value: 'all' | ClotureCategory; label: string }[] = [
  { value: 'all', label: 'Achats + Ventes + Avoirs' },
  { value: 'achats', label: 'Achats' },
  { value: 'ventes', label: 'Ventes' },
  { value: 'avoirs', label: 'Avoirs' },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export default function CloturePage() {
  const [year, setYear] = useState<number>(2025);
  const [month, setMonth] = useState<string>('all');
  const [category, setCategory] = useState<'all' | ClotureCategory>('all');
  const [search, setSearch] = useState('');
  const [onlyNotTransferred, setOnlyNotTransferred] = useState(false);

  const { rows, counters, isLoading, error, refetch } = useClotureData({
    year,
    month: month !== 'all' ? Number(month) : undefined,
    category: category !== 'all' ? category : undefined,
    search: search || undefined,
    onlyNotTransferred,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b">
        <ResponsiveToolbar
          title={
            <span className="flex items-center gap-2">
              <FileArchive className="h-5 w-5" />
              Clôture comptable
            </span>
          }
          subtitle="Vue unifiée pièces présentes + manquantes — préparez l'envoi Welyb"
          secondaryActions={
            <ClotureGlobalActions year={year} onSyncComplete={handleRefresh} />
          }
        />
      </div>

      {/* Filtres */}
      <div className="px-6 py-3 border-b bg-muted/30 flex flex-wrap items-center gap-3">
        {/* Année */}
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-[110px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mois */}
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_LABELS.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Catégorie */}
        <Select
          value={category}
          onValueChange={v => setCategory(v as 'all' | ClotureCategory)}
        >
          <SelectTrigger className="w-[220px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Recherche */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un partenaire…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        {/* Filtre non-transférées */}
        <label className="flex items-center gap-2 text-sm cursor-pointer ml-auto">
          <Switch
            checked={onlyNotTransferred}
            onCheckedChange={setOnlyNotTransferred}
          />
          <span className="text-muted-foreground whitespace-nowrap">
            Non transférées uniquement
          </span>
        </label>
      </div>

      {/* Compteurs */}
      <div className="px-6 py-3 border-b">
        <ClotureCountersBar counters={counters} isLoading={isLoading} />
      </div>

      {/* Erreur */}
      {error && (
        <div className="mx-6 mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table principale */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <ClotureTable
          rows={rows}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
