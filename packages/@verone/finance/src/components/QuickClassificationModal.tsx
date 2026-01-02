'use client';

/**
 * QuickClassificationModal - Modal de classification des dépenses V2
 *
 * Design moderne inspiré de Pennylane/Indy/Abie:
 * - Grand modal (80% largeur écran)
 * - Raccourcis visuels avec icônes colorées
 * - Recherche rapide avec autocomplétion
 * - Suggestions intelligentes basées sur l'historique
 * - Interface épurée et intuitive
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';
import { Switch } from '@verone/ui/components/ui/switch';
import { createClient } from '@verone/utils/supabase/client';
import {
  Check,
  Loader2,
  Search,
  ChevronRight,
  X,
  Sparkles,
  CreditCard,
  Building2,
  Plane,
  Monitor,
  Megaphone,
  Shield,
  FileText,
  Truck,
  Coffee,
  Wifi,
  Package,
  Users,
  Wrench,
  Receipt,
  ArrowLeft,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { useMatchingRules } from '../hooks/use-matching-rules';
import { ALL_PCG_CATEGORIES, type PcgCategory } from '../lib/pcg-categories';
import {
  TVA_RATES,
  calculateHT,
  calculateVAT,
  calculateTTC,
  type TvaRate,
} from '../lib/tva';

// Type pour les lignes de ventilation TVA
interface VatLine {
  id: string;
  description: string;
  amount_ht: number;
  tva_rate: TvaRate;
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

export interface QuickClassificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  amount?: number;
  transactionId?: string;
  counterpartyName?: string;
  /** Catégorie PCG actuelle (si déjà classifiée) */
  currentCategory?: string;
  /** ID de la règle existante (si modification) - masque l'option création de règle */
  existingRuleId?: string;
  onSuccess?: () => void;
  /** Nombre de transactions pour ce libellé (affichage "Appliquer aux X existantes") */
  transactionCount?: number;
  /** Fonction pour appliquer la règle aux transactions existantes */
  confirmApply?: (
    ruleId: string,
    selectedNormalizedLabels: string[]
  ) => Promise<{ nb_updated: number; updated_ids: string[] }>;
}

export function QuickClassificationModal({
  open,
  onOpenChange,
  label,
  amount = 0,
  transactionId,
  counterpartyName,
  currentCategory,
  existingRuleId,
  onSuccess,
  transactionCount,
  confirmApply,
}: QuickClassificationModalProps) {
  // Hooks
  const {
    rules,
    create: createMatchingRule,
    update: updateMatchingRule,
  } = useMatchingRules();

  // Mode modification: masquer la section création de règle
  const isModificationMode = Boolean(existingRuleId ?? currentCategory);

  // State - Catégorie
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryInfo, setSelectedCategoryInfo] =
    useState<PcgCategory | null>(null);

  // Info de la catégorie actuelle (pour affichage comparaison)
  const currentCategoryInfo = useMemo(() => {
    if (!currentCategory) return null;
    return ALL_PCG_CATEGORIES.find(c => c.code === currentCategory) || null;
  }, [currentCategory]);
  const [tvaRate, setTvaRate] = useState<TvaRate>(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createRule, setCreateRule] = useState(true);

  // State - Règle existante (pour éviter les doublons)
  const [existingRuleForLabel, setExistingRuleForLabel] = useState<{
    id: string;
    default_category: string | null;
    organisation_id: string | null;
  } | null>(null);

  // State - Appliquer aux transactions existantes (si confirmApply fourni)
  const [applyToExisting, setApplyToExisting] = useState(true);

  // State - Ventilation TVA multi-taux
  const [isVentilationMode, setIsVentilationMode] = useState(false);
  const [vatLines, setVatLines] = useState<VatLine[]>([
    { id: '1', description: '', amount_ht: 0, tva_rate: 10 },
    { id: '2', description: '', amount_ht: 0, tva_rate: 20 },
  ]);

  // Calculs TVA
  const htAmount = useMemo(
    () => calculateHT(Math.abs(amount), tvaRate),
    [amount, tvaRate]
  );
  const vatAmount = useMemo(
    () => calculateVAT(Math.abs(amount), tvaRate),
    [amount, tvaRate]
  );

  // Calculs ventilation TVA
  const ventilationTotals = useMemo(() => {
    const totalHT = vatLines.reduce(
      (sum, line) => sum + (line.amount_ht || 0),
      0
    );
    const totalVAT = vatLines.reduce(
      (sum, line) =>
        sum +
        calculateVAT(
          calculateTTC(line.amount_ht || 0, line.tva_rate),
          line.tva_rate
        ),
      0
    );
    const totalTTC = vatLines.reduce(
      (sum, line) => sum + calculateTTC(line.amount_ht || 0, line.tva_rate),
      0
    );
    const targetTTC = Math.abs(amount);
    const isValid = Math.abs(totalTTC - targetTTC) < 0.02; // Tolérance 2 centimes
    return { totalHT, totalVAT, totalTTC, targetTTC, isValid };
  }, [vatLines, amount]);

  // Format currency
  const formatAmount = (amt: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amt);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedCategory(null);
      setSelectedCategoryInfo(null);
      setTvaRate(20);
      setSearchQuery('');
      setShowAllCategories(false);
      setCreateRule(true);
      setExistingRuleForLabel(null);
      // Reset ventilation
      setIsVentilationMode(false);
      setVatLines([
        { id: '1', description: '', amount_ht: 0, tva_rate: 10 },
        { id: '2', description: '', amount_ht: 0, tva_rate: 20 },
      ]);
    }
  }, [open]);

  // Détecter les règles existantes pour ce label
  useEffect(() => {
    if (!open || !label || rules.length === 0) return;

    // Chercher règle existante avec le label exact (insensible à la casse)
    const found = rules.find(
      r =>
        r.match_type === 'label_contains' &&
        r.match_value.toLowerCase() === label.toLowerCase()
    );

    if (found) {
      setExistingRuleForLabel({
        id: found.id,
        default_category: found.default_category,
        organisation_id: found.organisation_id,
      });
    } else {
      setExistingRuleForLabel(null);
    }
  }, [open, label, rules]);

  // Recherche dans les catégories PCG
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    return ALL_PCG_CATEGORIES.filter(
      cat =>
        cat.label.toLowerCase().includes(query) ||
        cat.code.includes(query) ||
        cat.description?.toLowerCase().includes(query)
    ).slice(0, 12);
  }, [searchQuery]);

  // Sélectionner une catégorie
  const handleSelectCategory = useCallback((code: string) => {
    setSelectedCategory(code);
    const info = ALL_PCG_CATEGORIES.find(c => c.code === code);
    setSelectedCategoryInfo(info || null);
    setSearchQuery('');
  }, []);

  // Soumettre
  const handleSubmit = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // 1. Mettre à jour la transaction
      if (transactionId) {
        // Préparer les données selon le mode (simple ou ventilé)
        const updateData: Record<string, unknown> = isVentilationMode
          ? {
              category_pcg: selectedCategory,
              vat_rate: null, // NULL quand ventilé
              vat_breakdown: vatLines
                .filter(l => l.amount_ht > 0)
                .map(l => ({
                  description: l.description || `Ligne ${l.tva_rate}%`,
                  amount_ht: l.amount_ht,
                  tva_rate: l.tva_rate,
                  tva_amount: calculateVAT(
                    calculateTTC(l.amount_ht, l.tva_rate),
                    l.tva_rate
                  ),
                })),
              amount_ht: ventilationTotals.totalHT,
              amount_vat: ventilationTotals.totalVAT,
              matching_status: 'manual_matched',
            }
          : {
              category_pcg: selectedCategory,
              vat_rate: tvaRate,
              vat_breakdown: null, // NULL quand taux unique
              amount_ht: htAmount,
              amount_vat: vatAmount,
              matching_status: 'manual_matched',
            };

        const { error: updateError } = await supabase
          .from('bank_transactions')
          .update(updateData)
          .eq('id', transactionId);

        // Gestion d'erreur avec feedback utilisateur
        if (updateError) {
          console.error(
            '[QuickClassificationModal] Update failed:',
            updateError
          );
          toast.error(`Erreur: ${updateError.message}`);
          setIsSubmitting(false);
          return; // Ne pas fermer le modal si erreur
        }
      }

      // 2. Mode modification: mettre à jour la règle existante si la catégorie a changé
      if (existingRuleId && selectedCategory !== currentCategory) {
        // Construire les données TVA pour la règle
        const ruleVatData = isVentilationMode
          ? {
              default_vat_rate: null,
              vat_breakdown: vatLines
                .filter(l => l.amount_ht > 0)
                .map(l => ({
                  tva_rate: l.tva_rate,
                  percent: Math.round(
                    (l.amount_ht / ventilationTotals.totalHT) * 100
                  ),
                })),
            }
          : {
              default_vat_rate: tvaRate,
              vat_breakdown: null,
            };

        await updateMatchingRule(existingRuleId, {
          default_category: selectedCategory,
          ...ruleVatData,
        });
      }
      // 3. Mode création: créer ou mettre à jour la règle automatique (catégorie + TVA)
      // Note: L'organisation est gérée via OrganisationLinkingModal (page Règles → "Lier")
      // L'automatisation fusionne automatiquement les deux dans une seule règle
      else if (!isModificationMode && createRule && label) {
        let ruleIdForApply: string | null = null;

        // Construire les données TVA pour la règle
        const ruleVatData = isVentilationMode
          ? {
              default_vat_rate: null,
              vat_breakdown: vatLines
                .filter(l => l.amount_ht > 0)
                .map(l => ({
                  tva_rate: l.tva_rate,
                  percent: Math.round(
                    (l.amount_ht / ventilationTotals.totalHT) * 100
                  ),
                })),
            }
          : {
              default_vat_rate: tvaRate,
              vat_breakdown: null,
            };

        if (existingRuleForLabel) {
          // UPDATE règle existante avec la catégorie et TVA (fusion automatique)
          await updateMatchingRule(existingRuleForLabel.id, {
            default_category: selectedCategory,
            ...ruleVatData,
          });
          ruleIdForApply = existingRuleForLabel.id;
        } else {
          // CREATE nouvelle règle (catégorie + TVA)
          const newRule = await createMatchingRule({
            match_type: 'label_contains',
            match_value: label,
            display_label: label,
            organisation_id: null,
            counterparty_type: null,
            default_category: selectedCategory,
            default_role_type: 'supplier',
            priority: 100,
            ...ruleVatData,
          });
          ruleIdForApply = newRule?.id ?? null;
        }

        // 4. Appliquer aux transactions existantes si demandé
        if (applyToExisting && confirmApply && ruleIdForApply) {
          await confirmApply(ruleIdForApply, [label]);
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('[QuickClassificationModal] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        data-testid="modal-classify-pcg"
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 shadow-sm">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  Classifier la dépense
                </DialogTitle>
                <p className="text-sm text-slate-600 mt-0.5 max-w-md truncate">
                  {counterpartyName || label}
                </p>
              </div>
            </div>
            <div className="text-right bg-white rounded-xl px-4 py-2 shadow-sm border">
              <div className="text-2xl font-bold text-red-600">
                -{formatAmount(Math.abs(amount))}
              </div>
              <div className="text-xs text-slate-500">Montant TTC</div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Catégorie actuelle (si modification) */}
          {currentCategory && currentCategoryInfo && !selectedCategory && (
            <div className="mb-6 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 shadow-sm">
                  <Receipt className="h-6 w-6 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Catégorie actuelle
                  </div>
                  <div className="font-semibold text-slate-700 text-lg">
                    {currentCategoryInfo.label}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono bg-white">
                      {currentCategory}
                    </Badge>
                    {currentCategoryInfo.description && (
                      <span>{currentCategoryInfo.description}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comparaison ancien → nouveau (si modification) */}
          {selectedCategory &&
            selectedCategoryInfo &&
            currentCategory &&
            currentCategoryInfo &&
            selectedCategory !== currentCategory && (
              <div className="mb-6 rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-4">
                  Changement de catégorie
                </div>
                <div className="flex items-center gap-4">
                  {/* Ancienne catégorie */}
                  <div className="flex-1 rounded-xl bg-white/70 border border-slate-200 p-4">
                    <div className="text-xs text-slate-400 mb-1">Ancienne</div>
                    <div className="font-semibold text-slate-500 line-through">
                      {currentCategoryInfo.label}
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs mt-1 text-slate-400"
                    >
                      {currentCategory}
                    </Badge>
                  </div>

                  {/* Flèche */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>

                  {/* Nouvelle catégorie */}
                  <div className="flex-1 rounded-xl bg-green-50 border-2 border-green-300 p-4">
                    <div className="text-xs text-green-600 mb-1">Nouvelle</div>
                    <div className="font-semibold text-green-800">
                      {selectedCategoryInfo.label}
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs mt-1 bg-green-100 text-green-700 border-green-300"
                    >
                      {selectedCategory}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedCategoryInfo(null);
                    }}
                    className="text-slate-600 border-slate-300 hover:bg-white"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Annuler le changement
                  </Button>
                </div>
              </div>
            )}

          {/* Nouvelle catégorie sélectionnée (sans ancienne) */}
          {selectedCategory &&
            selectedCategoryInfo &&
            (!currentCategory || selectedCategory === currentCategory) && (
              <div className="mb-6 rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 shadow-sm">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-900 text-lg">
                        {selectedCategoryInfo.label}
                      </div>
                      <div className="text-sm text-green-700 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono bg-white/50"
                        >
                          {selectedCategory}
                        </Badge>
                        {selectedCategoryInfo.description && (
                          <span>{selectedCategoryInfo.description}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedCategoryInfo(null);
                    }}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Changer
                  </Button>
                </div>
              </div>
            )}

          {/* Recherche */}
          {!selectedCategory && (
            <>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Rechercher une catégorie (ex: hôtel, logiciel, assurance, abonnement...)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 text-lg rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Résultats de recherche */}
              {searchResults.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Résultats de recherche ({searchResults.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {searchResults.map(cat => (
                      <button
                        key={cat.code}
                        type="button"
                        onClick={() => handleSelectCategory(cat.code)}
                        className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-4 text-left hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                      >
                        <Badge
                          variant="outline"
                          className="font-mono text-xs shrink-0 bg-white"
                        >
                          {cat.code}
                        </Badge>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm">
                            {cat.label}
                          </div>
                          {cat.description && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Catégories populaires */}
              {!searchQuery && (
                <>
                  <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Catégories populaires
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {POPULAR_CATEGORIES.map(cat => {
                      const IconComponent = cat.icon;
                      return (
                        <button
                          key={cat.code}
                          type="button"
                          onClick={() => handleSelectCategory(cat.code)}
                          className={cn(
                            'flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer',
                            cat.color
                          )}
                        >
                          <IconComponent
                            className={cn('h-7 w-7 mb-2', cat.iconColor)}
                          />
                          <div className="font-semibold text-sm">
                            {cat.label}
                          </div>
                          <div className="text-xs opacity-80 mt-0.5">
                            {cat.description}
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Voir plus de catégories
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-600">
                          Plus de catégories
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowAllCategories(false)}
                          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Réduire
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {MORE_CATEGORIES.map(cat => {
                          const IconComponent = cat.icon;
                          return (
                            <button
                              key={cat.code}
                              type="button"
                              onClick={() => handleSelectCategory(cat.code)}
                              className={cn(
                                'flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer',
                                cat.color
                              )}
                            >
                              <IconComponent
                                className={cn('h-7 w-7 mb-2', cat.iconColor)}
                              />
                              <div className="font-semibold text-sm">
                                {cat.label}
                              </div>
                              <div className="text-xs opacity-80 mt-0.5">
                                {cat.description}
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

          {/* TVA - affiché après sélection de catégorie */}
          {selectedCategory && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Taux de TVA applicable
                </h3>
                {/* Toggle ventilation */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={isVentilationMode}
                    onCheckedChange={setIsVentilationMode}
                  />
                  <span className="text-sm text-slate-600">
                    Ventiler TVA (plusieurs taux)
                  </span>
                </label>
              </div>

              {/* Mode simple: grille de taux */}
              {!isVentilationMode && (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    {TVA_RATES.map(rate => (
                      <button
                        key={rate.value}
                        type="button"
                        onClick={() => setTvaRate(rate.value)}
                        className={cn(
                          'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all',
                          tvaRate === rate.value
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md'
                            : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        )}
                      >
                        <span
                          className={cn(
                            'text-xl font-bold',
                            tvaRate === rate.value
                              ? 'text-blue-700'
                              : 'text-slate-700'
                          )}
                        >
                          {rate.label}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 text-center">
                          {rate.description}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Récap montants mode simple */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-100 p-5">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-sm text-slate-500">
                          Montant HT
                        </span>
                        <div className="font-semibold text-lg">
                          {formatAmount(htAmount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-slate-500">TVA</span>
                        <div className="font-semibold text-lg">
                          {formatAmount(vatAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-slate-500">Total TTC</span>
                      <div className="font-bold text-xl text-slate-900">
                        {formatAmount(Math.abs(amount))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Mode ventilé: lignes de ventilation */}
              {isVentilationMode && (
                <div className="space-y-4">
                  {/* En-têtes */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2 text-right">Montant HT</div>
                    <div className="col-span-2 text-center">Taux</div>
                    <div className="col-span-2 text-right">TVA</div>
                    <div className="col-span-2 text-right">TTC</div>
                  </div>

                  {/* Lignes de ventilation */}
                  {vatLines.map((line, index) => {
                    const lineTTC = calculateTTC(
                      line.amount_ht || 0,
                      line.tva_rate
                    );
                    const lineVAT = calculateVAT(lineTTC, line.tva_rate);
                    return (
                      <div
                        key={line.id}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-4">
                          <Input
                            placeholder={`Ligne ${index + 1}`}
                            value={line.description}
                            onChange={e => {
                              const newLines = [...vatLines];
                              newLines[index] = {
                                ...line,
                                description: e.target.value,
                              };
                              setVatLines(newLines);
                            }}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={line.amount_ht || ''}
                            onChange={e => {
                              const newLines = [...vatLines];
                              newLines[index] = {
                                ...line,
                                amount_ht: parseFloat(e.target.value) || 0,
                              };
                              setVatLines(newLines);
                            }}
                            className="h-9 text-right"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={String(line.tva_rate)}
                            onValueChange={value => {
                              const newLines = [...vatLines];
                              newLines[index] = {
                                ...line,
                                tva_rate: parseFloat(value) as TvaRate,
                              };
                              setVatLines(newLines);
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TVA_RATES.map(rate => (
                                <SelectItem
                                  key={rate.value}
                                  value={String(rate.value)}
                                >
                                  {rate.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 text-right text-sm font-medium">
                          {formatAmount(lineVAT)}
                        </div>
                        <div className="col-span-2 text-right text-sm font-semibold">
                          {formatAmount(lineTTC)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Bouton ajouter ligne */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVatLines([
                        ...vatLines,
                        {
                          id: String(Date.now()),
                          description: '',
                          amount_ht: 0,
                          tva_rate: 20,
                        },
                      ]);
                    }}
                    className="w-full"
                  >
                    + Ajouter une ligne
                  </Button>

                  {/* Validation totaux */}
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-xl p-5',
                      ventilationTotals.isValid
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    )}
                  >
                    <div className="flex gap-6">
                      <div>
                        <span className="text-sm text-slate-500">Total HT</span>
                        <div className="font-semibold text-lg">
                          {formatAmount(ventilationTotals.totalHT)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-slate-500">
                          Total TVA
                        </span>
                        <div className="font-semibold text-lg">
                          {formatAmount(ventilationTotals.totalVAT)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-slate-500">Total TTC</span>
                      <div
                        className={cn(
                          'font-bold text-xl',
                          ventilationTotals.isValid
                            ? 'text-green-700'
                            : 'text-red-700'
                        )}
                      >
                        {formatAmount(ventilationTotals.totalTTC)} /{' '}
                        {formatAmount(ventilationTotals.targetTTC)}
                        {ventilationTotals.isValid ? ' ✓' : ' ⚠️'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Créer règle automatique - MASQUÉ en mode modification */}
              {!isModificationMode && (
                <>
                  <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-5 transition-all hover:bg-slate-50 hover:border-slate-300">
                    <input
                      type="checkbox"
                      checked={createRule}
                      onChange={e => setCreateRule(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900">
                        Créer une règle automatique
                      </span>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Les prochaines transactions "{label.slice(0, 30)}..."
                        seront classées automatiquement
                      </p>
                    </div>
                    <Zap className="h-5 w-5 text-amber-500" />
                  </label>

                  {/* Option pour appliquer aux transactions existantes */}
                  {createRule &&
                    confirmApply &&
                    transactionCount &&
                    transactionCount > 0 && (
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 ml-6 transition-all hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={applyToExisting}
                          onChange={e => setApplyToExisting(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-700">
                            Appliquer aux {transactionCount} transaction(s)
                            existante(s)
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Classifier immédiatement toutes les transactions
                            avec ce libellé
                          </p>
                        </div>
                      </label>
                    )}
                </>
              )}
            </div>
          )}
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
            disabled={!selectedCategory || isSubmitting}
            className="min-w-[160px] gap-2 h-12 text-base"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : isModificationMode ? (
              <>
                <Check className="h-5 w-5" />
                Modifier la catégorie
              </>
            ) : createRule ? (
              <>
                <Zap className="h-5 w-5" />
                Classifier + Règle
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Classifier
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
