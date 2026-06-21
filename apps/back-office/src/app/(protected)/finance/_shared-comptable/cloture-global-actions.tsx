'use client';

/**
 * Barre d'actions globales de la clôture comptable [BO-COMPTA-001]
 *
 * - Récupérer les pièces Qonto (sync-qonto-attachments)
 * - Préparer l'envoi Welyb Achats / Ventes (send-to-accountant dry-run)
 */

import { useCallback, useState } from 'react';

import { Button } from '@verone/ui';
import { Download, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

import type { SyncQontoResult, WelybDryRunResponse } from './types';
import { WelyBPlanDialog } from './welyb-plan-dialog';

interface ClotureGlobalActionsProps {
  year: number;
  onSyncComplete: () => void;
}

export function ClotureGlobalActions({
  year,
  onSyncComplete,
}: ClotureGlobalActionsProps) {
  const [syncLoading, setSyncLoading] = useState(false);
  const [welybAchatsLoading, setWelybAchatsLoading] = useState(false);
  const [welybVentesLoading, setWelybVentesLoading] = useState(false);
  const [welybPlan, setWelybPlan] = useState<WelybDryRunResponse | null>(null);
  const [welybPlanOpen, setWelybPlanOpen] = useState(false);

  const handleSyncQonto = useCallback(async () => {
    setSyncLoading(true);
    try {
      const res = await fetch('/api/finance/sync-qonto-attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Erreur lors de la synchronisation');
      }
      const data = (await res.json()) as SyncQontoResult;

      if (data.message && data.processed === 0) {
        toast.info(data.message);
      } else {
        toast.success(
          `${data.downloaded} pièce${data.downloaded > 1 ? 's' : ''} rapatriée${data.downloaded > 1 ? 's' : ''} depuis Qonto` +
            (data.failed > 0
              ? ` (${data.failed} échoué${data.failed > 1 ? 'es' : ''})`
              : '')
        );
      }
      onSyncComplete();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur synchronisation Qonto'
      );
    } finally {
      setSyncLoading(false);
    }
  }, [year, onSyncComplete]);

  const handlePrepareWelyb = useCallback(
    async (scope: 'achats' | 'ventes') => {
      const setLoading =
        scope === 'achats' ? setWelybAchatsLoading : setWelybVentesLoading;
      setLoading(true);
      try {
        const res = await fetch('/api/finance/send-to-accountant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // confirmSend intentionnellement absent (false par défaut = dry-run)
          body: JSON.stringify({ scope, year }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? 'Erreur lors de la préparation');
        }
        const data = (await res.json()) as WelybDryRunResponse;
        setWelybPlan(data);
        setWelybPlanOpen(true);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Erreur préparation Welyb'
        );
      } finally {
        setLoading(false);
      }
    },
    [year]
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Récupérer les pièces Qonto */}
        <Button
          variant="outline"
          size="sm"
          disabled={syncLoading}
          onClick={() => {
            void handleSyncQonto().catch(err => {
              console.error('[ClotureGlobalActions] sync failed:', err);
            });
          }}
          className="gap-2"
        >
          {syncLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Pièces Qonto
        </Button>

        {/* Préparer envoi Welyb Achats */}
        <Button
          variant="outline"
          size="sm"
          disabled={welybAchatsLoading}
          onClick={() => {
            void handlePrepareWelyb('achats').catch(err => {
              console.error('[ClotureGlobalActions] welyb achats failed:', err);
            });
          }}
          className="gap-2"
        >
          {welybAchatsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Préparer Welyb Achats
        </Button>

        {/* Préparer envoi Welyb Ventes */}
        <Button
          variant="outline"
          size="sm"
          disabled={welybVentesLoading}
          onClick={() => {
            void handlePrepareWelyb('ventes').catch(err => {
              console.error('[ClotureGlobalActions] welyb ventes failed:', err);
            });
          }}
          className="gap-2"
        >
          {welybVentesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Préparer Welyb Ventes
        </Button>
      </div>

      {/* Modale plan Welyb */}
      <WelyBPlanDialog
        data={welybPlan}
        open={welybPlanOpen}
        onOpenChange={open => {
          setWelybPlanOpen(open);
          if (!open) setWelybPlan(null);
        }}
      />
    </>
  );
}
