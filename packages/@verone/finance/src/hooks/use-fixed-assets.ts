'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface FixedAsset {
  id: string;
  label: string;
  description: string | null;
  pcg_account: string;
  pcg_amortissement: string;
  asset_category: 'incorporel' | 'corporel' | 'financier';
  acquisition_date: string;
  acquisition_amount: number;
  supplier_name: string | null;
  invoice_reference: string | null;
  depreciation_method: 'lineaire' | 'degressif';
  depreciation_duration_years: number;
  residual_value: number;
  total_depreciated: number;
  status: 'active' | 'fully_depreciated' | 'disposed';
  disposal_date: string | null;
  disposal_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface FixedAssetDepreciation {
  id: string;
  fixed_asset_id: string;
  fiscal_year: number;
  depreciation_amount: number;
  cumulative_amount: number;
  net_book_value: number;
  is_computed: boolean;
}

export interface FixedAssetFormData {
  label: string;
  description?: string;
  asset_category: 'incorporel' | 'corporel' | 'financier';
  pcg_account: string;
  acquisition_date: string;
  acquisition_amount: number;
  supplier_name?: string;
  invoice_reference?: string;
  depreciation_method: 'lineaire' | 'degressif';
  depreciation_duration_years: number;
  residual_value?: number;
}

// PCG accounts for immobilisations
export const PCG_IMMOBILISATION_ACCOUNTS = [
  { code: '205', label: 'Concessions, brevets, licences' },
  { code: '207', label: 'Fonds commercial' },
  { code: '211', label: 'Terrains' },
  { code: '213', label: 'Constructions' },
  { code: '215', label: 'Installations techniques, materiel' },
  { code: '218', label: 'Autres immobilisations corporelles' },
  { code: '261', label: 'Titres de participation' },
  { code: '275', label: 'Depots et cautionnements' },
] as const;

/**
 * Calcule le plan d'amortissement lineaire pour une immobilisation.
 */
export function computeDepreciationSchedule(
  asset: Pick<
    FixedAsset,
    | 'acquisition_amount'
    | 'acquisition_date'
    | 'depreciation_duration_years'
    | 'residual_value'
    | 'depreciation_method'
  >
): FixedAssetDepreciation[] {
  const base = asset.acquisition_amount - asset.residual_value;
  const years = asset.depreciation_duration_years;
  const startYear = new Date(asset.acquisition_date).getFullYear();
  const startMonth = new Date(asset.acquisition_date).getMonth(); // 0-indexed

  // Prorata temporis pour la première année (mois restants / 12)
  const prorata = (12 - startMonth) / 12;
  const annualAmount = Math.round((base / years) * 100) / 100;

  const schedule: FixedAssetDepreciation[] = [];
  let cumulative = 0;

  for (let i = 0; i <= years; i++) {
    const fiscalYear = startYear + i;
    let amount: number;

    if (i === 0) {
      // Première année : prorata temporis
      amount = Math.round(annualAmount * prorata * 100) / 100;
    } else if (i === years) {
      // Dernière année : complément prorata
      amount = Math.round(base * 100) / 100 - cumulative;
      if (amount <= 0) continue;
    } else {
      amount = annualAmount;
    }

    cumulative = Math.round((cumulative + amount) * 100) / 100;
    const nbv = Math.round((base - cumulative) * 100) / 100;

    schedule.push({
      id: '',
      fixed_asset_id: '',
      fiscal_year: fiscalYear,
      depreciation_amount: amount,
      cumulative_amount: cumulative,
      net_book_value: Math.max(0, nbv),
      is_computed: true,
    });
  }

  return schedule;
}

export function useFixedAssets() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
      const { data, error: fetchError } = await (
        supabase as { from: CallableFunction }
      )
        .from('fixed_assets')
        .select('*')
        .order('acquisition_date', { ascending: false });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

      if (fetchError)
        throw new Error((fetchError as { message: string }).message);
      setAssets((data ?? []) as FixedAsset[]);
    } catch (err) {
      console.error('[useFixedAssets] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAsset = useCallback(
    async (formData: FixedAssetFormData) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const pcgAmort = '28' + formData.pcg_account.substring(1);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
      const db = supabase as any;

      const { data, error: insertError } = await db
        .from('fixed_assets')
        .insert({
          ...formData,
          pcg_amortissement: pcgAmort,
          residual_value: formData.residual_value ?? 0,
          created_by: user?.id,
        })
        .select()
        .single();

      if (insertError)
        throw new Error((insertError as { message: string }).message);

      const asset = data as FixedAsset;
      const schedule = computeDepreciationSchedule(asset);

      if (schedule.length > 0) {
        const rows = schedule.map(s => ({
          fixed_asset_id: asset.id,
          fiscal_year: s.fiscal_year,
          depreciation_amount: s.depreciation_amount,
          cumulative_amount: s.cumulative_amount,
          net_book_value: s.net_book_value,
          is_computed: true,
        }));

        const { error: depError } = await db
          .from('fixed_asset_depreciations')
          .insert(rows);

        if (depError)
          console.error(
            '[useFixedAssets] Depreciation insert error:',
            depError
          );

        const currentYear = new Date().getFullYear();
        const currentLine = schedule.find(s => s.fiscal_year === currentYear);
        if (currentLine) {
          await db
            .from('fixed_assets')
            .update({ total_depreciated: currentLine.cumulative_amount })
            .eq('id', asset.id);
        }
      }
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

      await fetchAssets();
      return asset;
    },
    [fetchAssets]
  );

  const deleteAsset = useCallback(
    async (id: string) => {
      const supabase = createClient();
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
      const { error: delError } = await (supabase as any)
        .from('fixed_assets')
        .delete()
        .eq('id', id);
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
      if (delError) throw new Error((delError as { message: string }).message);
      await fetchAssets();
    },
    [fetchAssets]
  );

  useEffect(() => {
    void fetchAssets();
  }, [fetchAssets]);

  // Computed stats
  const totalBrut = assets.reduce((s, a) => s + a.acquisition_amount, 0);
  const totalAmort = assets.reduce((s, a) => s + a.total_depreciated, 0);
  const totalNet = totalBrut - totalAmort;
  const activeCount = assets.filter(a => a.status === 'active').length;

  return {
    assets,
    isLoading,
    error,
    refetch: fetchAssets,
    createAsset,
    deleteAsset,
    stats: { totalBrut, totalAmort, totalNet, activeCount },
  };
}
