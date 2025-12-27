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
  Zap,
} from 'lucide-react';

import { useMatchingRules } from '../hooks/use-matching-rules';
import { ALL_PCG_CATEGORIES, type PcgCategory } from '../lib/pcg-categories';
import { TVA_RATES, calculateHT, calculateVAT, type TvaRate } from '../lib/tva';

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
  onSuccess?: () => void;
}

export function QuickClassificationModal({
  open,
  onOpenChange,
  label,
  amount = 0,
  transactionId,
  counterpartyName,
  onSuccess,
}: QuickClassificationModalProps) {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryInfo, setSelectedCategoryInfo] =
    useState<PcgCategory | null>(null);
  const [tvaRate, setTvaRate] = useState<TvaRate>(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createRule, setCreateRule] = useState(true);

  const { create: createMatchingRule, applyOne } = useMatchingRules();

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
      setSelectedCategory(null);
      setSelectedCategoryInfo(null);
      setTvaRate(20);
      setSearchQuery('');
      setShowAllCategories(false);
      setCreateRule(true);
    }
  }, [open]);

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
        await supabase
          .from('bank_transactions')
          .update({
            category_pcg: selectedCategory,
            vat_rate: tvaRate,
            amount_ht: htAmount,
            amount_vat: vatAmount,
            matching_status: 'manual_matched',
          })
          .eq('id', transactionId);
      }

      // 2. Créer une règle de matching si demandé
      if (createRule && label) {
        const newRule = await createMatchingRule({
          match_type: 'label_contains',
          match_value: label,
          organisation_id: null,
          default_category: selectedCategory,
          default_role_type: 'supplier',
          priority: 100,
        });

        if (newRule) {
          await applyOne(newRule.id);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
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
          {/* Catégorie sélectionnée */}
          {selectedCategory && selectedCategoryInfo && (
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
              <h3 className="text-sm font-semibold text-slate-700">
                Taux de TVA applicable
              </h3>
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

              {/* Récap montants */}
              <div className="flex items-center justify-between rounded-xl bg-slate-100 p-5">
                <div className="flex gap-6">
                  <div>
                    <span className="text-sm text-slate-500">Montant HT</span>
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

              {/* Créer règle automatique */}
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
                    Les prochaines transactions "{label.slice(0, 30)}..." seront
                    classées automatiquement
                  </p>
                </div>
                <Zap className="h-5 w-5 text-amber-500" />
              </label>
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
