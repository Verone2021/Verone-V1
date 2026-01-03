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
import { Label } from '@verone/ui/components/ui/label';
import { Switch } from '@verone/ui/components/ui/switch';
import { createClient } from '@verone/utils/supabase/client';
import {
  Building2,
  Check,
  Loader2,
  Plus,
  Search,
  Settings,
  X,
  FileText,
  Tag,
  Coffee,
  Monitor,
  CreditCard,
  Plane,
  Megaphone,
  Shield,
  Wifi,
  Package,
  Users,
  Wrench,
  Truck,
  Receipt,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { ApplyExistingWizard } from './ApplyExistingWizard';
import type {
  MatchingRule,
  CreateRuleData,
  PreviewMatchResult,
} from '../hooks/use-matching-rules';
import {
  ALL_PCG_CATEGORIES,
  getPcgCategory,
  type PcgCategory,
} from '../lib/pcg-categories';

// Type pour les organisations trouvées
interface FoundOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  type: string;
  is_service_provider: boolean;
}

// Catégories populaires avec icônes et couleurs
const POPULAR_CATEGORIES = [
  {
    code: '6256',
    label: 'Hôtel & Repas',
    description: 'Missions, déplacements',
    icon: Coffee,
    color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
    iconColor: 'text-amber-600',
  },
  {
    code: '651',
    label: 'Logiciels SaaS',
    description: 'Abonnements, licences',
    icon: Monitor,
    color:
      'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
    iconColor: 'text-purple-600',
  },
  {
    code: '6278',
    label: 'Frais Bancaires',
    description: 'Commissions, tenue compte',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    code: '623',
    label: 'Marketing & Pub',
    description: 'Publicité, communication',
    icon: Megaphone,
    color: 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200',
    iconColor: 'text-pink-600',
  },
  {
    code: '6226',
    label: 'Honoraires',
    description: 'Comptable, avocat',
    icon: FileText,
    color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
    iconColor: 'text-slate-600',
  },
  {
    code: '616',
    label: 'Assurances',
    description: 'Toutes assurances pro',
    icon: Shield,
    color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
    iconColor: 'text-green-600',
  },
  {
    code: '6262',
    label: 'Télécom & Internet',
    description: 'Forfaits, abonnements',
    icon: Wifi,
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200',
    iconColor: 'text-cyan-600',
  },
  {
    code: '6251',
    label: 'Transport',
    description: 'Train, avion, carburant',
    icon: Plane,
    color:
      'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200',
    iconColor: 'text-indigo-600',
  },
];

// Plus de catégories pour la vue complète
const MORE_CATEGORIES = [
  {
    code: '607',
    label: 'Achats Marchandises',
    description: 'Produits pour revente',
    icon: Package,
    color:
      'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
    iconColor: 'text-yellow-600',
  },
  {
    code: '6132',
    label: 'Loyer Bureaux',
    description: 'Locations immobilières',
    icon: Building2,
    color:
      'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
    iconColor: 'text-orange-600',
  },
  {
    code: '6257',
    label: 'Repas Affaires',
    description: 'Réceptions clients',
    icon: Coffee,
    color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200',
    iconColor: 'text-rose-600',
  },
  {
    code: '615',
    label: 'Entretien & Réparations',
    description: 'Maintenance, réparations',
    icon: Wrench,
    color: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200',
    iconColor: 'text-teal-600',
  },
  {
    code: '624',
    label: 'Livraisons',
    description: 'Frais de port, transport',
    icon: Truck,
    color:
      'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
    iconColor: 'text-emerald-600',
  },
  {
    code: '641',
    label: 'Salaires',
    description: 'Rémunérations personnel',
    icon: Users,
    color:
      'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200',
    iconColor: 'text-violet-600',
  },
  {
    code: '6064',
    label: 'Fournitures Bureau',
    description: 'Papeterie, consommables',
    icon: FileText,
    color: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
    iconColor: 'text-gray-600',
  },
  {
    code: '658',
    label: 'Charges Diverses',
    description: 'Autres charges de gestion',
    icon: Receipt,
    color:
      'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200',
    iconColor: 'text-neutral-600',
  },
];

export interface RuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Mode édition: passer la règle existante
  rule?: MatchingRule | null;

  // Mode création: passer le label initial
  initialLabel?: string;
  initialCategory?: string;

  // Callbacks
  onCreate?: (data: CreateRuleData) => Promise<MatchingRule | null>;
  onUpdate?: (
    ruleId: string,
    data: {
      organisation_id?: string | null;
      default_category?: string | null;
      enabled?: boolean;
      allow_multiple_categories?: boolean;
      // TVA retirée des règles - vient de Qonto OCR ou saisie manuelle
      match_patterns?: string[] | null;
    }
  ) => Promise<boolean>;
  /** Preview apply - affiche les transactions qui seront modifiées */
  previewApply?: (
    ruleId: string,
    newCategory?: string
  ) => Promise<PreviewMatchResult[]>;
  /** Confirm apply - applique aux labels sélectionnés */
  confirmApply?: (
    ruleId: string,
    selectedNormalizedLabels: string[]
  ) => Promise<{ nb_updated: number; updated_ids: string[] }>;
  onSuccess?: () => void;
}

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

  // State - Catégorie
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryInfo, setSelectedCategoryInfo] =
    useState<PcgCategory | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showCategorySearch, setShowCategorySearch] = useState(false);
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
        setMatchValue(initialLabel || '');
        setMatchPatterns(initialLabel ? [initialLabel] : []);
        setAllowMultipleCategories(false);
        setSelectedCategory(initialCategory || null);
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

  // Recherche de catégories
  const categorySearchResults =
    categorySearchQuery.length >= 2
      ? ALL_PCG_CATEGORIES.filter(
          cat =>
            cat.label
              .toLowerCase()
              .includes(categorySearchQuery.toLowerCase()) ||
            cat.code.includes(categorySearchQuery) ||
            cat.description
              ?.toLowerCase()
              .includes(categorySearchQuery.toLowerCase())
        ).slice(0, 8)
      : [];

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
          p_type: 'supplier',
        });

        if (signal) {
          queryBuilder = queryBuilder.abortSignal(signal);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;
        setOrgSearchResults(
          ((data ?? []) as FoundOrganisation[]).map(org => ({
            ...org,
            trade_name: (org as { trade_name?: string }).trade_name || null,
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
      searchOrganisations(orgSearchQuery, abortControllerRef.current?.signal);
    }, 300);

    return () => clearTimeout(timer);
  }, [orgSearchQuery, searchOrganisations]);

  // Sélectionner une catégorie
  const handleSelectCategory = useCallback((code: string) => {
    setSelectedCategory(code);
    const info = ALL_PCG_CATEGORIES.find(c => c.code === code);
    setSelectedCategoryInfo(info || null);
    setCategorySearchQuery('');
    setShowCategorySearch(false);
  }, []);

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
        // TVA gérée automatiquement par Qonto OCR (plus de default_vat_rate)
        const updateData = {
          organisation_id: selectedOrg?.id ?? null,
          default_category: selectedCategory,
          enabled,
          allow_multiple_categories: allowMultipleCategories,
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

        // TVA gérée automatiquement par Qonto OCR (plus de default_vat_rate)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0" data-testid="modal-rule">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl shadow-sm',
                isEditMode ? 'bg-blue-100' : 'bg-green-100'
              )}
            >
              {isEditMode ? (
                <Settings className="h-5 w-5 text-blue-600" />
              ) : (
                <Plus className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {isEditMode ? 'Modifier la règle' : 'Créer une règle'}
              </DialogTitle>
              {isEditMode && rule && (
                <p className="text-sm text-slate-600 mt-0.5 max-w-sm truncate">
                  {rule.match_value}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Body - avec scroll */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Pattern de matching - modifiable uniquement en création */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              {isEditMode ? 'Patterns de matching' : 'Pattern de matching'}
            </Label>
            {isEditMode ? (
              <>
                {/* Liste des patterns existants */}
                <div className="space-y-2">
                  {matchPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border bg-slate-50 p-2"
                    >
                      <span className="font-mono text-sm text-slate-700">
                        {pattern}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePattern(pattern)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        disabled={matchPatterns.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {/* Ajouter un pattern */}
                <div className="flex gap-2">
                  <Input
                    value={newPatternInput}
                    onChange={e => setNewPatternInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPattern();
                      }
                    }}
                    placeholder="Ajouter un libellé alternatif..."
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPattern}
                    disabled={!newPatternInput.trim()}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Ajoutez des variantes du libellé (ex: &quot;AMÉRICO&quot;,
                  &quot;AMERICO&quot;)
                </p>
              </>
            ) : (
              <Input
                value={matchValue}
                onChange={e => setMatchValue(e.target.value)}
                placeholder="Ex: STRIPE, AMAZON, OVH..."
                className="font-mono"
              />
            )}
            {!isEditMode && (
              <p className="text-xs text-slate-500">
                Les transactions contenant ce texte seront automatiquement
                classées
              </p>
            )}
          </div>

          {/* Statut Enabled */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <span className="font-medium text-slate-900">Règle active</span>
              <p className="text-sm text-slate-500">
                Les nouvelles transactions seront classées automatiquement
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Autoriser plusieurs catégories */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <span className="font-medium text-slate-900">
                Autoriser plusieurs catégories
              </span>
              <p className="text-sm text-slate-500">
                Permet de modifier la catégorie individuellement par transaction
              </p>
            </div>
            <Switch
              checked={allowMultipleCategories}
              onCheckedChange={setAllowMultipleCategories}
            />
          </div>

          {/* Organisation */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500" />
              Organisation liée
              <span className="text-xs font-normal text-slate-400">
                (optionnel)
              </span>
            </h3>

            {selectedOrg && !showOrgSearch ? (
              <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-slate-900">
                    {selectedOrg.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOrgSearch(true)}
                    className="text-slate-500"
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrg(null)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : !selectedOrg && !showOrgSearch ? (
              <div className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-slate-200 p-3">
                <p className="text-sm text-slate-500 text-center">
                  Aucune organisation liée
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOrgSearch(true)}
                  className="mx-auto"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  Ajouter une organisation
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Rechercher une organisation..."
                    value={orgSearchQuery}
                    onChange={e => setOrgSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {isSearchingOrg && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>

                {orgSearchResults.length > 0 && (
                  <div className="space-y-1 max-h-[150px] overflow-y-auto border rounded-lg p-1">
                    {orgSearchResults.map(org => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrg({
                            id: org.id,
                            name: org.legal_name,
                            isServiceProvider: org.is_service_provider,
                          });
                          setOrgSearchQuery('');
                          setShowOrgSearch(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-slate-100"
                      >
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-sm truncate">
                          {org.legal_name}
                        </span>
                        {org.is_service_provider && (
                          <Badge variant="outline" className="text-xs">
                            Prestataire
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowOrgSearch(false);
                    setOrgSearchQuery('');
                  }}
                  className="text-slate-500"
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              </div>
            )}
          </div>

          {/* Catégorie PCG - Grille visuelle */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              Catégorie comptable
              <span className="text-xs font-normal text-slate-400">
                (optionnel)
              </span>
            </h3>

            {/* Catégorie sélectionnée */}
            {selectedCategory && selectedCategoryInfo ? (
              <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <Badge variant="outline" className="font-mono bg-white">
                    {selectedCategory}
                  </Badge>
                  <span className="text-sm font-medium text-slate-700">
                    {selectedCategoryInfo.label}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedCategoryInfo(null);
                  }}
                  className="text-slate-500 hover:text-red-500"
                >
                  <X className="h-4 w-4 mr-1" />
                  Changer
                </Button>
              </div>
            ) : (
              <>
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Rechercher une catégorie..."
                    value={categorySearchQuery}
                    onChange={e => setCategorySearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {categorySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCategorySearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Résultats de recherche */}
                {categorySearchResults.length > 0 && (
                  <div className="space-y-1 max-h-[180px] overflow-y-auto border rounded-lg p-2">
                    {categorySearchResults.map(cat => (
                      <button
                        key={cat.code}
                        type="button"
                        onClick={() => handleSelectCategory(cat.code)}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <Badge
                          variant="outline"
                          className="font-mono text-xs shrink-0 bg-white"
                        >
                          {cat.code}
                        </Badge>
                        <span className="text-sm truncate">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Grille des catégories populaires */}
                {!categorySearchQuery && (
                  <>
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-4 mb-2">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Catégories populaires
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {POPULAR_CATEGORIES.map(cat => {
                        const IconComponent = cat.icon;
                        return (
                          <button
                            key={cat.code}
                            type="button"
                            onClick={() => handleSelectCategory(cat.code)}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer',
                              cat.color
                            )}
                          >
                            <IconComponent
                              className={cn('h-5 w-5 shrink-0', cat.iconColor)}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-xs truncate">
                                {cat.label}
                              </div>
                              <div className="text-[10px] opacity-70 truncate">
                                {cat.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Plus de catégories */}
                    {!showAllCategories ? (
                      <button
                        type="button"
                        onClick={() => setShowAllCategories(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors mt-2"
                      >
                        Voir plus de catégories
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mt-4 mb-2">
                          <div className="text-xs font-medium text-slate-500">
                            Plus de catégories
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAllCategories(false)}
                            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                          >
                            <ArrowLeft className="h-3 w-3" />
                            Réduire
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {MORE_CATEGORIES.map(cat => {
                            const IconComponent = cat.icon;
                            return (
                              <button
                                key={cat.code}
                                type="button"
                                onClick={() => handleSelectCategory(cat.code)}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer',
                                  cat.color
                                )}
                              >
                                <IconComponent
                                  className={cn(
                                    'h-5 w-5 shrink-0',
                                    cat.iconColor
                                  )}
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-xs truncate">
                                    {cat.label}
                                  </div>
                                  <div className="text-[10px] opacity-70 truncate">
                                    {cat.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* TVA retirée - gérée automatiquement par Qonto OCR */}
          {/* Saisie manuelle possible directement sur la transaction */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t bg-slate-50 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-600"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !matchValue.trim()}
            className="min-w-[140px] gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : isEditMode ? (
              <>
                <Check className="h-4 w-4" />
                Enregistrer
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Créer la règle
              </>
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Wizard ApplyExisting */}
      {(rule || createdRule) && previewApply && confirmApply && (
        <ApplyExistingWizard
          open={showApplyWizard}
          onOpenChange={setShowApplyWizard}
          rule={(rule || createdRule)!}
          newCategory={selectedCategory || undefined}
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
