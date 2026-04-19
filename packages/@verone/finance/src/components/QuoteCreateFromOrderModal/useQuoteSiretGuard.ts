'use client';

import { useState, useCallback } from 'react';

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
}

export function useQuoteSiretGuard(
  order: IOrderForDocument | null
): IQuoteSiretGuard {
  const { toast } = useToast();
  const [siretInput, setSiretInput] = useState('');
  const [savingSiret, setSavingSiret] = useState(false);
  const [siretSaved, setSiretSaved] = useState(false);

  const isMissingSiret =
    order?.customer_type === 'organization' &&
    !order.organisations?.siret &&
    !order.organisations?.vat_number &&
    !siretSaved;

  const reset = useCallback((): void => {
    setSiretInput('');
    setSavingSiret(false);
    setSiretSaved(false);
  }, []);

  const handleSaveSiret = useCallback(async (): Promise<void> => {
    if (!order?.customer_id || !siretInput.trim()) return;

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
        .eq('id', order.customer_id);

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
  }, [order?.customer_id, siretInput, toast]);

  return {
    isMissingSiret,
    siretInput,
    setSiretInput,
    savingSiret,
    siretSaved,
    handleSaveSiret,
    reset,
  };
}
