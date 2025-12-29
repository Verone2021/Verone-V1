'use client';

/**
 * SimpleExpenseModal - Modal simplifié pour classifier les dépenses
 *
 * Workflow simplifié (approche Pennylane/Indy):
 * 1. Sélectionner une catégorie PCG (obligatoire)
 * 2. Optionnellement lier à une organisation
 * 3. Valider
 *
 * L'organisation est FACULTATIVE - seule la catégorie comptable est requise.
 */

import { useCallback, useEffect, useState } from 'react';

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
  FileText,
} from 'lucide-react';

import { CategoryCardGrid, suggestCategory } from './CategoryCardGrid';
import { useMatchingRules } from '../hooks/use-matching-rules';
import {
  PCG_SUGGESTED_CATEGORIES,
  getPcgCategory,
} from '../lib/pcg-categories';

interface Organisation {
  id: string;
  legal_name: string;
  type: string;
}

interface SimpleExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Libellé de la transaction (pour matching et suggestion) */
  label: string;
  /** Montant de la transaction */
  amount?: number;
  /** ID de la transaction bancaire (pour upload pièce jointe) */
  transactionId?: string;
  /** Callback après succès */
  onSuccess?: () => void;
  /** Callback pour ouvrir le modal d'upload */
  onUploadClick?: () => void;
}

export function SimpleExpenseModal({
  open,
  onOpenChange,
  label,
  amount = 0,
  transactionId,
  onSuccess,
  onUploadClick,
}: SimpleExpenseModalProps) {
  // State
  const [category, setCategory] = useState<string | null>(null);
  const [showOrgSection, setShowOrgSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createRule, setCreateRule] = useState(true);

  const { create: createMatchingRule, applyOne } = useMatchingRules();

  // Suggestion de catégorie
  const suggestedCategory = suggestCategory(label);

  // Format currency
  const formatAmount = (amt: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(Math.abs(amt));

  // Reset on open
  useEffect(() => {
    if (open) {
      setCategory(suggestedCategory);
      setShowOrgSection(false);
      setSearchQuery('');
      setOrganisations([]);
      setSelectedOrg(null);
      setCreateRule(true);
    }
  }, [open, suggestedCategory]);

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
      console.error('[SimpleExpenseModal] Search error:', err);
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
      // Créer une règle de matching si demandé
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
      console.error('[SimpleExpenseModal] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryInfo = category ? getPcgCategory(category) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-slate-600" />
            Classifier la dépense
          </DialogTitle>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Badge variant="outline" className="font-mono">
              {label}
            </Badge>
            {amount !== 0 && (
              <span className="text-red-600 font-medium">
                -{formatAmount(amount)}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Catégorie PCG (obligatoire) */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                1
              </span>
              Catégorie comptable
              <span className="text-red-500">*</span>
            </h4>
            <CategoryCardGrid
              value={category}
              onChange={setCategory}
              suggestedCategory={suggestedCategory}
            />
          </div>

          {/* Organisation (facultative) */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowOrgSection(!showOrgSection)}
              className="flex w-full items-center justify-between text-sm text-slate-600 hover:text-slate-900"
            >
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Lier à une organisation (facultatif)
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
                Les prochaines transactions "{label}" seront classées
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
