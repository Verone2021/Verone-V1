'use client';

import { useState, useCallback, useEffect } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import type { IOrderForDocument } from '../OrderSelectModal';

export interface IQuoteSiretGuard {
  isMissingSiret: boolean;
  siretInput: string;
  setSiretInput: (v: string) => void;
  savingSiret: boolean;
  siretSaved: boolean;
  handleSaveSiret: () => Promise<void>;
  reset: () => void;
  /** SIRET ou VAT de l'org de facturation choisie (null si non disponible) */
  billingOrgSiret: string | null;
}

interface IBillingOrgSiretData {
  siret: string | null;
  vat_number: string | null;
}

export function useQuoteSiretGuard(
  order: IOrderForDocument | null,
  billingOrgId?: string | null
): IQuoteSiretGuard {
  const { toast } = useToast();
  const [siretInput, setSiretInput] = useState('');
  const [savingSiret, setSavingSiret] = useState(false);
  const [siretSaved, setSiretSaved] = useState(false);
  const [billingOrgData, setBillingOrgData] =
    useState<IBillingOrgSiretData | null>(null);
  const [loadingBillingOrg, setLoadingBillingOrg] = useState(false);

  // Fetch le SIRET/VAT de l'org de facturation choisie si differente de l'org commande
  useEffect(() => {
    const isDifferentOrg =
      billingOrgId && order?.customer_id && billingOrgId !== order.customer_id;

    if (!isDifferentOrg) {
      setBillingOrgData(null);
      return;
    }

    setLoadingBillingOrg(true);
    const supabase = createClient();
    const fetchBillingOrg = async () => {
      try {
        const { data, error } = await supabase
          .from('organisations')
          .select('siret, vat_number')
          .eq('id', billingOrgId)
          .single();

        if (error) throw error;
        setBillingOrgData({
          siret: data?.siret ?? null,
          vat_number: data?.vat_number ?? null,
        });
      } catch (err) {
        console.error('[useQuoteSiretGuard] Failed to fetch billing org:', err);
        setBillingOrgData(null);
      } finally {
        setLoadingBillingOrg(false);
      }
    };

    void fetchBillingOrg();
  }, [billingOrgId, order?.customer_id]);

  // Determiner l'org de reference pour le guard
  const effectiveSiret = billingOrgData?.siret ?? order?.organisations?.siret;
  const effectiveVat =
    billingOrgData?.vat_number ?? order?.organisations?.vat_number;

  // Si billingOrgId est fourni et different → utiliser les donnees fetchees
  // (pendant le chargement, on ne bloque pas — evite le flash de guard)
  const useBillingOrgData =
    billingOrgId && order?.customer_id && billingOrgId !== order.customer_id;

  const isMissingSiret =
    order?.customer_type === 'organization' &&
    !siretSaved &&
    !loadingBillingOrg &&
    (useBillingOrgData
      ? !billingOrgData?.siret && !billingOrgData?.vat_number
      : !order?.organisations?.siret && !order?.organisations?.vat_number);

  const billingOrgSiret = useBillingOrgData
    ? (billingOrgData?.siret ?? billingOrgData?.vat_number ?? null)
    : (effectiveSiret ?? effectiveVat ?? null);

  const reset = useCallback((): void => {
    setSiretInput('');
    setSavingSiret(false);
    setSiretSaved(false);
    setBillingOrgData(null);
  }, []);

  const handleSaveSiret = useCallback(async (): Promise<void> => {
    // Sauvegarder sur l'org de facturation choisie si differente, sinon sur l'org commande
    const targetOrgId =
      billingOrgId && billingOrgId !== order?.customer_id
        ? billingOrgId
        : order?.customer_id;

    if (!targetOrgId || !siretInput.trim()) return;

    setSavingSiret(true);
    try {
      const trimmed = siretInput.trim();
      const isSiretFormat = /^\d{14}$/.test(trimmed);
      const updateData = isSiretFormat
        ? { siret: trimmed }
        : { vat_number: trimmed };

      const supabase = createClient();
      const { error } = await supabase
        .from('organisations')
        .update(updateData)
        .eq('id', targetOrgId);

      if (error) throw error;

      setSiretSaved(true);
      toast({
        title: 'SIRET sauvegardé',
        description: `${isSiretFormat ? 'SIRET' : 'N° TVA'} enregistré pour l'organisation`,
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : 'Impossible de sauvegarder le SIRET',
        variant: 'destructive',
      });
    } finally {
      setSavingSiret(false);
    }
  }, [billingOrgId, order?.customer_id, siretInput, toast]);

  return {
    isMissingSiret,
    siretInput,
    setSiretInput,
    savingSiret,
    siretSaved,
    handleSaveSiret,
    reset,
    billingOrgSiret,
  };
}
