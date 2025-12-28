'use client';

/**
 * ClassificationModal - Modal complet pour classifier les dépenses
 *
 * Workflow conforme Pennylane/Indy:
 * 1. Catégorie PCG (OBLIGATOIRE)
 * 2. Taux de TVA (OBLIGATOIRE)
 * 3. Mode de paiement (auto-détecté, modifiable)
 * 4. Organisation (FACULTATIF - section repliable)
 * 5. Option créer règle automatique
 */

import { useCallback, useEffect, useState, useMemo } from 'react';

import { cn } from '@verone/ui';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import { Input } from '@verone/ui/components/ui/input';
import { createClient } from '@verone/utils/supabase/client';
import {
  Check,
  Loader2,
  Building2,
  Search,
  ChevronDown,
  ChevronUp,
  Upload,
  Receipt,
} from 'lucide-react';

import { HierarchicalCategorySelector } from './HierarchicalCategorySelector';
import { useMatchingRules } from '../hooks/use-matching-rules';
import {
  BANK_PAYMENT_METHODS,
  detectBankPaymentMethod,
  type BankPaymentMethod,
} from '../lib/payment-methods';
import { TVA_RATES, calculateHT, calculateVAT, type TvaRate } from '../lib/tva';

interface Organisation {
  id: string;
  legal_name: string;
  type: string;
}

export interface ClassificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Libellé de la transaction (pour matching et suggestion) */
  label: string;
  /** Montant TTC de la transaction */
  amount?: number;
  /** ID de la transaction bancaire */
  transactionId?: string;
  /** Callback après succès */
  onSuccess?: () => void;
  /** Callback pour ouvrir le modal d'upload */
  onUploadClick?: () => void;
}

export function ClassificationModal({
  open,
  onOpenChange,
  label,
  amount = 0,
  transactionId,
  onSuccess,
  onUploadClick,
}: ClassificationModalProps) {
  // State - Classification
  const [category, setCategory] = useState<string | null>(null);
  const [tvaRate, setTvaRate] = useState<TvaRate>(20);
  const [paymentMethod, setPaymentMethod] = useState<BankPaymentMethod | null>(
    null
  );

  // State - Organisation (facultatif)
  const [showOrgSection, setShowOrgSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);

  // State - UI
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createRule, setCreateRule] = useState(true);

  const { create: createMatchingRule, applyOne } = useMatchingRules();

  // Détection automatique du mode de paiement
  const detectedPaymentMethod = useMemo(
    () => detectBankPaymentMethod(label),
    [label]
  );

  // Calculs TVA
  const htAmount = useMemo(
    () => calculateHT(Math.abs(amount), tvaRate),
    [amount, tvaRate]
  );
  const vatAmount = useMemo(
    () => calculateVAT(Math.abs(amount), tvaRate),
    [amount, tvaRate]
  );

  // Format currency
  const formatAmount = (amt: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amt);

  // Reset on open
  useEffect(() => {
    if (open) {
      setCategory(null);
      setTvaRate(20); // TVA normale par défaut
      setPaymentMethod(detectedPaymentMethod);
      setShowOrgSection(false);
      setSearchQuery('');
      setOrganisations([]);
      setSelectedOrg(null);
      setCreateRule(true);
    }
  }, [open, detectedPaymentMethod]);

  // Search organisations
  const searchOrganisations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setOrganisations([]);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('id, legal_name, type')
        .or(`legal_name.ilike.%${query}%,trade_name.ilike.%${query}%`)
        .eq('type', 'supplier')
        .is('archived_at', null)
        .order('legal_name')
        .limit(5);

      if (error) throw error;
      setOrganisations((data || []) as Organisation[]);
    } catch (err) {
      console.error('[ClassificationModal] Search error:', err);
      setOrganisations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchOrganisations(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOrganisations]);

  // Submit
  const handleSubmit = async () => {
    if (!category) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // 1. Mettre à jour la transaction si on a un ID
      if (transactionId) {
        await supabase
          .from('bank_transactions')
          .update({
            // Champs classification
            organisation_id: selectedOrg?.id || null,
            matching_status: 'manual_matched',
            // Champs comptabilité PCG
            category_pcg: category,
            vat_rate: tvaRate,
            payment_method: paymentMethod,
            amount_ht: htAmount,
            amount_vat: vatAmount,
          })
          .eq('id', transactionId);
      }

      // 2. Créer une règle de matching si demandé
      if (createRule) {
        const newRule = await createMatchingRule({
          match_type: 'label_contains',
          match_value: label,
          organisation_id: selectedOrg?.id || null,
          default_category: category,
          default_role_type: 'supplier',
          priority: 100,
        });

        // Appliquer aux transactions existantes
        if (newRule) {
          await applyOne(newRule.id);
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('[ClassificationModal] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-slate-600" />
            Classifier la dépense
          </DialogTitle>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Badge
              variant="outline"
              className="font-mono max-w-[200px] truncate"
            >
              {label}
            </Badge>
            {amount !== 0 && (
              <span className="text-red-600 font-semibold">
                -{formatAmount(Math.abs(amount))}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* ÉTAPE 1: Catégorie PCG (obligatoire) */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                1
              </span>
              Catégorie comptable
              <span className="text-red-500">*</span>
            </h4>
            <HierarchicalCategorySelector
              value={category}
              onChange={setCategory}
              filterType="charges"
            />
          </div>

          {/* ÉTAPE 2: Taux de TVA (obligatoire) */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                2
              </span>
              Taux de TVA
              <span className="text-red-500">*</span>
            </h4>

            {/* Sélecteur TVA */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {TVA_RATES.map(rate => (
                <button
                  key={rate.value}
                  type="button"
                  onClick={() => setTvaRate(rate.value)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border-2 p-2 transition-all',
                    tvaRate === rate.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      tvaRate === rate.value
                        ? 'text-blue-700'
                        : 'text-slate-700'
                    )}
                  >
                    {rate.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {rate.description}
                  </span>
                </button>
              ))}
            </div>

            {/* Décomposition montants */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex gap-4">
                <div>
                  <span className="text-slate-500">Montant HT:</span>{' '}
                  <span className="font-medium">{formatAmount(htAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500">TVA:</span>{' '}
                  <span className="font-medium">{formatAmount(vatAmount)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500">TTC:</span>{' '}
                <span className="font-semibold text-slate-900">
                  {formatAmount(Math.abs(amount))}
                </span>
              </div>
            </div>
          </div>

          {/* ÉTAPE 3: Mode de paiement (auto-détecté) */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-white text-xs font-bold">
                3
              </span>
              Mode de paiement
              {detectedPaymentMethod && (
                <Badge variant="secondary" className="text-xs">
                  Auto-détecté
                </Badge>
              )}
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {BANK_PAYMENT_METHODS.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border p-2 transition-all',
                    paymentMethod === method.value
                      ? 'border-blue-500 bg-blue-50'
                      : detectedPaymentMethod === method.value
                        ? 'border-blue-300 bg-blue-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <span className="text-lg">{method.icon}</span>
                  <span className="text-[10px] text-slate-600 mt-1">
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ÉTAPE 4: Organisation (facultative - repliable) */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowOrgSection(!showOrgSection)}
              className="flex w-full items-center justify-between text-sm text-slate-600 hover:text-slate-900"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-white text-xs">
                  4
                </span>
                <Building2 className="h-4 w-4" />
                Lier à une organisation
                <Badge variant="outline" className="text-xs">
                  Facultatif
                </Badge>
              </span>
              {showOrgSection ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showOrgSection && (
              <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une organisation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {organisations.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {organisations.map(org => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => setSelectedOrg(org)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg border p-2 text-sm transition-colors',
                          selectedOrg?.id === org.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="flex-1 text-left">
                          {org.legal_name}
                        </span>
                        {selectedOrg?.id === org.id && (
                          <Check className="h-4 w-4 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {selectedOrg && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2 text-sm">
                    <Check className="h-4 w-4 text-blue-500" />
                    <span>
                      Lié à <strong>{selectedOrg.legal_name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrg(null)}
                      className="ml-auto text-xs text-slate-500 hover:text-slate-700"
                    >
                      Retirer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload pièce jointe */}
          {onUploadClick && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onUploadClick}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                Ajouter une pièce jointe
              </Button>
            </div>
          )}

          {/* Créer règle automatique */}
          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
              createRule ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
            )}
          >
            <input
              type="checkbox"
              checked={createRule}
              onChange={e => setCreateRule(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-500"
            />
            <div>
              <span className="font-medium">Créer une règle automatique</span>
              <p className="text-xs text-slate-500">
                Les prochaines transactions similaires seront classées
                automatiquement
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!category || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Classifier
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
