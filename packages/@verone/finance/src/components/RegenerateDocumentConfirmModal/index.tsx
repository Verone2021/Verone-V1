'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  ScrollArea,
  Textarea,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ICustomLineToPreserve {
  title: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

interface RegenerateDocumentConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'quote' | 'proforma';
  existingCustomLines: ICustomLineToPreserve[];
  existingNotes: string;
  onConfirm: (
    customLinesToPreserve: ICustomLineToPreserve[],
    notesToPreserve: string,
    cascade?: boolean
  ) => void;
  isLoading?: boolean;
  /** [BO-RLS-PERF-002 étape 3] ID de la commande source pour charger le récap des nouveaux totaux */
  orderId?: string | null;
  /** [BO-RLS-PERF-002 étape 3] ID du document actuel pour comparer "avant / après" */
  currentDocumentId?: string | null;
  /** [BO-RLS-PERF-002 bug fix] Affiche un message de cascade si on régénère les 2 docs liés en même temps */
  cascadeMode?: boolean;
  /** Type du document compagnon (pour wording cascade) */
  companionType?: 'quote' | 'proforma';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function diffClass(oldVal: number | null, newVal: number | null): string {
  if (oldVal === null || newVal === null) return 'text-foreground';
  if (Math.abs(oldVal - newVal) < 0.005) return 'text-muted-foreground';
  return newVal > oldVal ? 'text-emerald-700' : 'text-amber-700';
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

/**
 * Modal de confirmation avant régénération d'un devis ou proforma.
 *
 * Permet à l'utilisateur de :
 * - Voir un récap des nouveaux totaux (calculés depuis la commande source)
 * - Comparer avec les totaux actuels du document si fournis
 * - Choisir quelles lignes libres (customLines) préserver
 * - Choisir si les notes doivent être préservées
 * - Confirmer ou annuler la régénération
 *
 * Les items issus de la commande sont toujours inclus (R2 — readonly).
 */
export function RegenerateDocumentConfirmModal({
  open,
  onOpenChange,
  documentType,
  existingCustomLines,
  existingNotes,
  onConfirm,
  isLoading = false,
  orderId,
  currentDocumentId,
  cascadeMode = false,
  companionType,
}: RegenerateDocumentConfirmModalProps): React.ReactNode {
  // Toutes les customLines cochées par défaut
  const [checkedLines, setCheckedLines] = useState<boolean[]>(() =>
    existingCustomLines.map(() => true)
  );
  const [preserveNotes, setPreserveNotes] = useState(existingNotes.length > 0);

  const docLabel = documentType === 'quote' ? 'devis' : 'proforma';
  const companionLabel = companionType === 'quote' ? 'devis' : 'proforma';

  // [BO-RLS-PERF-002 étape 3] Fetch totaux à jour depuis la commande source
  const { data: orderTotals, isLoading: orderLoading } = useQuery({
    queryKey: ['regenerate-modal-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const supabase = createClient();
      const { data } = await supabase
        .from('sales_orders')
        .select(
          'total_ht, total_ttc, shipping_cost_ht, handling_cost_ht, insurance_cost_ht, sales_order_items(id)'
        )
        .eq('id', orderId)
        .single();
      if (!data) return null;
      const items = data.sales_order_items as Array<{ id: string }> | null;
      return {
        total_ht: Number(data.total_ht ?? 0),
        total_ttc: Number(data.total_ttc ?? 0),
        fees_ht:
          Number(data.shipping_cost_ht ?? 0) +
          Number(data.handling_cost_ht ?? 0) +
          Number(data.insurance_cost_ht ?? 0),
        items_count: items?.length ?? 0,
      };
    },
    enabled: open && !!orderId,
    staleTime: 10_000,
  });

  // [BO-RLS-PERF-002 étape 3] Fetch totaux du document actuel pour comparaison
  const { data: currentTotals } = useQuery({
    queryKey: ['regenerate-modal-current-doc', currentDocumentId],
    queryFn: async () => {
      if (!currentDocumentId) return null;
      const supabase = createClient();
      const { data } = await supabase
        .from('financial_documents')
        .select('total_ht, total_ttc')
        .eq('id', currentDocumentId)
        .single();
      if (!data) return null;
      return {
        total_ht: Number(data.total_ht ?? 0),
        total_ttc: Number(data.total_ttc ?? 0),
      };
    },
    enabled: open && !!currentDocumentId,
    staleTime: 10_000,
  });

  const handleConfirm = (): void => {
    const linesToPreserve = existingCustomLines.filter(
      (_, i) => checkedLines[i]
    );
    const notes = preserveNotes ? existingNotes : '';
    onConfirm(linesToPreserve, notes, cascadeMode);
  };

  const handleLineToggle = (index: number): void => {
    setCheckedLines(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const hasCustomLines = existingCustomLines.length > 0;
  const hasNotes = existingNotes.length > 0;
  const showDiff = !!currentTotals && !!orderTotals;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            {cascadeMode
              ? `Régénérer ce ${docLabel} ET le ${companionLabel} lié`
              : 'Régénérer le brouillon depuis la commande'}
          </DialogTitle>
          <DialogDescription>
            {cascadeMode
              ? `Les deux documents brouillons seront supprimés et recréés avec les données actuelles de la commande.`
              : `Le ${docLabel} actuel sera supprimé et recréé avec les données actuelles de la commande.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* [BO-RLS-PERF-002 étape 3] Récap des nouveaux totaux */}
          {orderId && (
            <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <p className="text-sm font-semibold text-amber-900">
                Récap du nouveau brouillon
              </p>
              {orderLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des données de la commande…
                </div>
              ) : orderTotals ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">Articles</span>
                  <span className="font-medium text-right">
                    {orderTotals.items_count}
                  </span>

                  <span className="text-muted-foreground">
                    Frais (livraison + manutention + assurance)
                  </span>
                  <span className="font-medium text-right">
                    {formatAmount(orderTotals.fees_ht)} HT
                  </span>

                  <span className="text-muted-foreground">Total HT</span>
                  {showDiff && currentTotals ? (
                    <span className="text-right">
                      <span className="text-muted-foreground line-through mr-2">
                        {formatAmount(currentTotals.total_ht)}
                      </span>
                      <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" />
                      <span
                        className={`font-semibold ${diffClass(currentTotals.total_ht, orderTotals.total_ht)}`}
                      >
                        {formatAmount(orderTotals.total_ht)}
                      </span>
                    </span>
                  ) : (
                    <span className="font-medium text-right">
                      {formatAmount(orderTotals.total_ht)}
                    </span>
                  )}

                  <span className="text-muted-foreground font-medium">
                    Total TTC
                  </span>
                  {showDiff && currentTotals ? (
                    <span className="text-right">
                      <span className="text-muted-foreground line-through mr-2">
                        {formatAmount(currentTotals.total_ttc)}
                      </span>
                      <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" />
                      <span
                        className={`font-bold ${diffClass(currentTotals.total_ttc, orderTotals.total_ttc)}`}
                      >
                        {formatAmount(orderTotals.total_ttc)}
                      </span>
                    </span>
                  ) : (
                    <span className="font-bold text-right">
                      {formatAmount(orderTotals.total_ttc)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Impossible de charger les données de la commande.
                </p>
              )}
              {showDiff &&
                currentTotals &&
                orderTotals &&
                Math.abs(currentTotals.total_ttc - orderTotals.total_ttc) >=
                  0.01 && (
                  <p className="text-xs text-amber-800 italic">
                    Le total TTC va changer de{' '}
                    {formatAmount(currentTotals.total_ttc)} à{' '}
                    {formatAmount(orderTotals.total_ttc)}.
                  </p>
                )}
            </div>
          )}

          {/* Section lignes libres */}
          {hasCustomLines ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Lignes libres à préserver</p>
              <p className="text-xs text-muted-foreground">
                Ces lignes ne sont pas issues de la commande. Sélectionnez
                celles que vous souhaitez conserver dans le nouveau {docLabel}.
              </p>
              <ScrollArea className="max-h-48 border rounded-md p-3">
                <div className="space-y-2">
                  {existingCustomLines.map((line, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Checkbox
                        id={`line-${i}`}
                        checked={checkedLines[i]}
                        onCheckedChange={() => handleLineToggle(i)}
                      />
                      <Label
                        htmlFor={`line-${i}`}
                        className="flex-1 cursor-pointer space-y-0.5"
                      >
                        <span className="text-sm font-normal">
                          {line.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {line.quantity} x {formatAmount(line.unit_price_ht)}{' '}
                          HT — {Math.round(line.vat_rate * 100)}% TVA
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground rounded-md border border-dashed p-3 text-center">
              Aucune ligne libre dans ce {docLabel}.
            </div>
          )}

          {/* Section notes */}
          {hasNotes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="preserve-notes"
                  checked={preserveNotes}
                  onCheckedChange={checked =>
                    setPreserveNotes(checked === true)
                  }
                />
                <Label htmlFor="preserve-notes" className="cursor-pointer">
                  Conserver les notes
                </Label>
              </div>
              {preserveNotes && (
                <Textarea
                  value={existingNotes}
                  readOnly
                  rows={3}
                  className="text-xs bg-muted resize-none"
                />
              )}
            </div>
          )}

          {/* Avertissement */}
          <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
            <p className="text-xs text-orange-700">
              Les articles issus de la commande seront recalculés depuis les
              données actuelles (R2 — prix readonly).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {cascadeMode ? 'Régénérer les deux' : 'Régénérer maintenant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
