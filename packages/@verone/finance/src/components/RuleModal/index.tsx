'use client';

/**
 * RuleModal - Modal UNIFIÉ pour création ET édition de règles
 *
 * SLICE 2 - Refactor Compta: UN SEUL composant pour toutes les règles
 *
 * Modes:
 * - Création: passer `initialLabel` (match_value par défaut)
 * - Édition: passer `rule` existante
 *
 * Permet de:
 * - Définir le pattern de matching (label)
 * - Lier une organisation (optionnel)
 * - Définir la catégorie PCG (optionnel)
 * - Activer/désactiver la règle
 * - Appliquer rétroactivement
 */

import { useCallback, useEffect, useState, useRef } from 'react';

import { Dialog, DialogContent } from '@verone/ui/components/ui/dialog';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import { ApplyExistingWizard } from '../ApplyExistingWizard';
import type { MatchingRule } from '../../hooks/use-matching-rules';
import { getPcgCategory, type PcgCategory } from '../../lib/pcg-categories';

import type { FoundOrganisation, RuleModalProps } from './types';
import { RuleModalHeader } from './RuleModalHeader';
import { MatchPatternSection } from './MatchPatternSection';
import { RuleToggles } from './RuleToggles';
import { OrgSearchSection } from './OrgSearchSection';
import { CategorySection } from './CategorySection';
import { RuleModalFooter } from './RuleModalFooter';

export type { RuleModalProps };

export function RuleModal({
  open,
  onOpenChange,
  rule,
  initialLabel,
  initialCategory,
  onCreate,
  onUpdate,
  previewApply,
  confirmApply,
  onSuccess,
}: RuleModalProps) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const isEditMode = Boolean(rule);

  // State - Commun
  const [enabled, setEnabled] = useState(true);
  const [matchValue, setMatchValue] = useState('');
  const [matchPatterns, setMatchPatterns] = useState<string[]>([]);
  const [newPatternInput, setNewPatternInput] = useState('');

  // State - Wizard ApplyExisting
  const [showApplyWizard, setShowApplyWizard] = useState(false);
  const [createdRule, setCreatedRule] = useState<MatchingRule | null>(null);
  const [allowMultipleCategories, setAllowMultipleCategories] = useState(false);
  const [justificationOptional, setJustificationOptional] = useState(false);

  // State - Catégorie
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryInfo, setSelectedCategoryInfo] =
    useState<PcgCategory | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [_showCategorySearch, setShowCategorySearch] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // State - Organisation
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [orgSearchResults, setOrgSearchResults] = useState<FoundOrganisation[]>(
    []
  );
  const [selectedOrg, setSelectedOrg] = useState<{
    id: string;
    name: string;
    isServiceProvider?: boolean;
  } | null>(null);
  const [isSearchingOrg, setIsSearchingOrg] = useState(false);
  const [showOrgSearch, setShowOrgSearch] = useState(false);

  // TVA retirée - désormais gérée automatiquement par Qonto OCR
  // Saisie manuelle possible directement sur la transaction (pas dans les règles)

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser les valeurs
  useEffect(() => {
    if (open) {
      // Reset wizard state
      setShowApplyWizard(false);
      setCreatedRule(null);
      setNewPatternInput('');

      if (rule) {
        // Mode édition
        setEnabled(rule.enabled);
        setMatchValue(rule.match_value);
        // Multi-patterns: charger depuis match_patterns ou fallback sur match_value
        setMatchPatterns(rule.match_patterns ?? [rule.match_value]);
        setAllowMultipleCategories(rule.allow_multiple_categories ?? false);
        setJustificationOptional(rule.justification_optional ?? false);
        setSelectedCategory(rule.default_category);
        const catInfo = rule.default_category
          ? getPcgCategory(rule.default_category)
          : null;
        setSelectedCategoryInfo(catInfo ?? null);
        setSelectedOrg(
          rule.organisation_id && rule.organisation_name
            ? { id: rule.organisation_id, name: rule.organisation_name }
            : null
        );
        // TVA retirée - gérée par Qonto OCR
      } else {
        // Mode création
        setEnabled(true);
        setMatchValue(initialLabel ?? '');
        setMatchPatterns(initialLabel ? [initialLabel] : []);
        setAllowMultipleCategories(false);
        setJustificationOptional(false);
        setSelectedCategory(initialCategory ?? null);
        const catInfo = initialCategory
          ? getPcgCategory(initialCategory)
          : null;
        setSelectedCategoryInfo(catInfo ?? null);
        setSelectedOrg(null);
        // TVA retirée - gérée par Qonto OCR
      }
      setCategorySearchQuery('');
      setOrgSearchQuery('');
      setShowCategorySearch(false);
      setShowOrgSearch(false);
      setShowAllCategories(false);
    }
  }, [open, rule, initialLabel, initialCategory]);

  // Recherche d'organisations - utilise RPC unaccent pour trouver "AMÉRICO" avec "americo"
  const searchOrganisations = useCallback(
    async (query: string, signal?: AbortSignal) => {
      if (!query || query.trim().length < 2) {
        setOrgSearchResults([]);
        return;
      }

      setIsSearchingOrg(true);
      try {
        const supabase = createClient();
        let queryBuilder = supabase.rpc('search_organisations_unaccent', {
          p_query: query,
          p_type: 'supplier,partner',
        });

        if (signal) {
          queryBuilder = queryBuilder.abortSignal(signal);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;
        setOrgSearchResults(
          ((data ?? []) as FoundOrganisation[]).map(org => ({
            ...org,
            trade_name: (org as { trade_name?: string }).trade_name ?? null,
          }))
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('[RuleModal] Org search error:', err);
          setOrgSearchResults([]);
        }
      } finally {
        setIsSearchingOrg(false);
      }
    },
    []
  );

  // Debounce org search
  useEffect(() => {
    if (!orgSearchQuery || orgSearchQuery.length < 2) {
      setOrgSearchResults([]);
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const timer = setTimeout(() => {
      void searchOrganisations(
        orgSearchQuery,
        abortControllerRef.current?.signal
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [orgSearchQuery, searchOrganisations]);

  // Sélectionner une catégorie
  const handleSelectCategory = useCallback((code: string) => {
    setSelectedCategory(code);
    const info = getPcgCategory(code);
    setSelectedCategoryInfo(info ?? null);
    setCategorySearchQuery('');
    setShowCategorySearch(false);
  }, []);

  // Ajouter un nouveau pattern
  const handleAddPattern = () => {
    const trimmed = newPatternInput.trim();
    if (trimmed && !matchPatterns.includes(trimmed)) {
      setMatchPatterns([...matchPatterns, trimmed]);
      setNewPatternInput('');
    }
  };

  // Supprimer un pattern
  const handleRemovePattern = (patternToRemove: string) => {
    setMatchPatterns(matchPatterns.filter(p => p !== patternToRemove));
  };

  // Callback après succès du wizard
  const handleWizardSuccess = () => {
    onSuccess?.();
    setShowApplyWizard(false);
    onOpenChange(false);
  };

  // Soumettre et auto-sync
  const handleSubmit = async () => {
    if (!matchValue.trim()) {
      toast.error('Le pattern de matching est requis');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && rule && onUpdate) {
        // Mode édition - mettre à jour la règle + auto-sync
        const updateData = {
          organisation_id: selectedOrg?.id ?? null,
          default_category: selectedCategory,
          enabled,
          allow_multiple_categories: allowMultipleCategories,
          justification_optional: justificationOptional,
          match_patterns: matchPatterns.length > 0 ? matchPatterns : null,
        };

        const success = await onUpdate(rule.id, updateData);

        if (success) {
          toast.success('Règle sauvegardée');
          // Ouvrir le wizard pour synchroniser les transactions si les callbacks sont disponibles
          if (previewApply && confirmApply) {
            setShowApplyWizard(true);
          } else {
            onSuccess?.();
            onOpenChange(false);
          }
        }
      } else if (onCreate) {
        // Mode création
        const roleType = selectedOrg?.isServiceProvider
          ? 'partner'
          : 'supplier';

        const newRule = await onCreate({
          match_type: 'label_contains',
          match_value: matchValue.trim(),
          match_patterns:
            matchPatterns.length > 0 ? matchPatterns : [matchValue.trim()],
          display_label: matchValue.trim(),
          organisation_id: selectedOrg?.id ?? null,
          default_category: selectedCategory,
          default_role_type: roleType,
          priority: 100,
          allow_multiple_categories: allowMultipleCategories,
          justification_optional: justificationOptional,
        });

        if (newRule) {
          toast.success('Règle créée');
          // Stocker la règle créée pour le wizard
          setCreatedRule(newRule);
          // Ouvrir le wizard pour synchroniser les transactions si les callbacks sont disponibles
          if (previewApply && confirmApply) {
            setShowApplyWizard(true);
          } else {
            onSuccess?.();
            onOpenChange(false);
          }
        }
      }
    } catch (err) {
      console.error('[RuleModal] Submit error:', err);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0" data-testid="modal-rule">
        {/* Header */}
        <RuleModalHeader isEditMode={isEditMode} rule={rule} />

        {/* Body - avec scroll */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <MatchPatternSection
            isEditMode={isEditMode}
            matchValue={matchValue}
            onMatchValueChange={setMatchValue}
            matchPatterns={matchPatterns}
            newPatternInput={newPatternInput}
            onNewPatternInputChange={setNewPatternInput}
            onAddPattern={handleAddPattern}
            onRemovePattern={handleRemovePattern}
          />

          <RuleToggles
            enabled={enabled}
            onEnabledChange={setEnabled}
            allowMultipleCategories={allowMultipleCategories}
            onAllowMultipleCategoriesChange={setAllowMultipleCategories}
            justificationOptional={justificationOptional}
            onJustificationOptionalChange={setJustificationOptional}
          />

          <OrgSearchSection
            selectedOrg={selectedOrg}
            showOrgSearch={showOrgSearch}
            orgSearchQuery={orgSearchQuery}
            orgSearchResults={orgSearchResults}
            isSearchingOrg={isSearchingOrg}
            onOrgSearchQueryChange={setOrgSearchQuery}
            onSelectOrg={org => {
              setSelectedOrg(org);
              setOrgSearchQuery('');
              setShowOrgSearch(false);
            }}
            onClearOrg={() => setSelectedOrg(null)}
            onShowOrgSearch={setShowOrgSearch}
          />

          <CategorySection
            selectedCategory={selectedCategory}
            selectedCategoryInfo={selectedCategoryInfo}
            categorySearchQuery={categorySearchQuery}
            showAllCategories={showAllCategories}
            onCategorySearchQueryChange={setCategorySearchQuery}
            onSelectCategory={handleSelectCategory}
            onClearCategory={() => {
              setSelectedCategory(null);
              setSelectedCategoryInfo(null);
            }}
            onShowAllCategories={setShowAllCategories}
          />

          {/* TVA retirée - gérée automatiquement par Qonto OCR */}
          {/* Saisie manuelle possible directement sur la transaction */}
        </div>

        {/* Footer */}
        <RuleModalFooter
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          canSubmit={Boolean(matchValue.trim())}
          onCancel={() => onOpenChange(false)}
          onSubmit={() => void handleSubmit()}
        />
      </DialogContent>

      {/* Wizard ApplyExisting */}
      {(rule ?? createdRule) && previewApply && confirmApply && (
        <ApplyExistingWizard
          open={showApplyWizard}
          onOpenChange={setShowApplyWizard}
          rule={(rule ?? createdRule)!}
          newCategory={selectedCategory ?? undefined}
          previewApply={previewApply}
          confirmApply={confirmApply}
          onSuccess={handleWizardSuccess}
        />
      )}
    </Dialog>
  );
}

// Export aussi l'ancien nom pour rétro-compatibilité pendant la transition
export { RuleModal as RuleEditModal };
