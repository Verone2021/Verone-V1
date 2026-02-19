'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import type { Product } from '@verone/categories';
import { useCatalogue } from '@verone/categories';
import { useFamilies } from '@verone/categories';
import { useCategories } from '@verone/categories';
import { useSubcategories } from '@verone/categories';
import { CategoryHierarchyModal } from '@verone/categories/components/modals/CategorizeModal';
import { useOrganisations } from '@verone/organisations';
import { SupplierSelector } from '@verone/organisations/components/suppliers';
import { ProductCardV2 as ProductCard } from '@verone/products';
import type { QuickEditField } from '@verone/products';
import { useProductImages, useProductImagesBatch } from '@verone/products';
import { ProductPhotosModal } from '@verone/products/components/modals';
import { ViewModeToggle } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@verone/ui';
import {
  CommandPaletteSearch as CommandPalette,
  type SearchItem,
} from '@verone/ui-business/components/utils/CommandPaletteSearch';
import { toast } from 'sonner';
import { checkSLOCompliance, debounce } from '@verone/utils';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Plus,
  Package,
  Zap,
  X,
  RotateCcw,
  AlertTriangle,
  Ruler,
  Weight,
} from 'lucide-react';

import {
  CatalogueFilterPanel,
  type FilterState,
} from '@/components/catalogue/CatalogueFilterPanel';

// Nouveaux composants UX/UI 2025
// Interface Produit selon business rules - utilise maintenant celle du hook useCatalogue

// Interface filtres - NOUVEAU: multi-niveaux (Famille > Catégorie > Sous-catégorie)
interface Filters {
  search: string;
  families: string[]; // ← NOUVEAU
  categories: string[]; // ← NOUVEAU
  subcategories: string[];
  suppliers: string[];
  statuses: string[];
}

export default function CataloguePage() {
  const startTime = Date.now();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Hook Supabase pour les données réelles
  const {
    products,
    loading,
    error,
    total,
    setFilters: setCatalogueFilters,
    loadArchivedProducts,
    loadIncompleteProducts,
    archiveProduct,
    unarchiveProduct,
    deleteProduct,
    // Pagination
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    itemsPerPage,
  } = useCatalogue();

  // Hooks pour l'arborescence de catégories
  const { families } = useFamilies();
  const { allCategories } = useCategories();
  const { subcategories } = useSubcategories();

  // ✅ NOUVEAU: Hook pour charger TOUS les fournisseurs avec compteurs produits
  const { organisations: allSuppliers } = useOrganisations({
    type: 'supplier',
    is_active: true,
  });

  // 🚀 PERF FIX 2026-01-30: Batch fetch images pour TOUS les produits actifs
  const productIds = products.map(p => p.id);
  const { getPrimaryImage } = useProductImagesBatch(productIds);

  // Helper pour lire les filtres depuis l'URL
  const parseUrlFilters = useCallback(
    (): Filters => ({
      search: searchParams.get('q') ?? '',
      families: searchParams.get('families')?.split(',').filter(Boolean) ?? [],
      categories:
        searchParams.get('categories')?.split(',').filter(Boolean) ?? [],
      subcategories:
        searchParams.get('subcategories')?.split(',').filter(Boolean) ?? [],
      suppliers:
        searchParams.get('suppliers')?.split(',').filter(Boolean) ?? [],
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean) ?? [],
    }),
    [searchParams]
  );

  // État local
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<
    'active' | 'incomplete' | 'archived'
  >(() => {
    const tab = searchParams.get('tab');
    if (tab === 'incomplete' || tab === 'archived') return tab;
    return 'active';
  });
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [incompleteProducts, setIncompleteProducts] = useState<Product[]>([]);
  const [incompleteTotal, setIncompleteTotal] = useState(0);
  const [incompleteLoading, setIncompleteLoading] = useState(false);
  const [incompletePage, setIncompletePage] = useState(1);

  // Batch fetch images pour produits incomplets (onglet "À compléter")
  const incompleteProductIds = useMemo(
    () => incompleteProducts.map(p => p.id),
    [incompleteProducts]
  );
  const { getPrimaryImage: getIncompletePrimaryImage } =
    useProductImagesBatch(incompleteProductIds);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // État local pour la recherche (contrôlé) - initialisé depuis URL
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get('q') ?? ''
  );
  // État filtres multi-niveaux - initialisé depuis URL
  const [filters, setFilters] = useState<Filters>(parseUrlFilters);

  // Quick-Complete: état pour l'édition inline
  const [quickEditTarget, setQuickEditTarget] = useState<{
    product: Product;
    field: QuickEditField;
  } | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState('');
  const [quickEditSaving, setQuickEditSaving] = useState(false);
  const [quickEditWeight, setQuickEditWeight] = useState('');
  const [quickEditDimensions, setQuickEditDimensions] = useState({
    length: '',
    width: '',
    height: '',
  });

  // Helper pour synchroniser filtres vers URL (router.replace pour ne pas polluer l'historique)
  const syncFiltersToUrl = useCallback(
    (newFilters: Filters, tab?: string) => {
      const params = new URLSearchParams();
      if (newFilters.search) params.set('q', newFilters.search);
      if (tab && tab !== 'active') params.set('tab', tab);
      if (newFilters.families.length)
        params.set('families', newFilters.families.join(','));
      if (newFilters.categories.length)
        params.set('categories', newFilters.categories.join(','));
      if (newFilters.subcategories.length)
        params.set('subcategories', newFilters.subcategories.join(','));
      if (newFilters.suppliers.length)
        params.set('suppliers', newFilters.suppliers.join(','));
      if (newFilters.statuses.length)
        params.set('statuses', newFilters.statuses.join(','));

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '/produits/catalogue', { scroll: false });
    },
    [router]
  );

  // Synchronise filtres vers useCatalogue + URL
  const applyFilters = useCallback(
    (newFilters: Filters, tab?: string) => {
      setFilters(newFilters);
      setCatalogueFilters({
        search: newFilters.search,
        families: newFilters.families,
        categories: newFilters.categories,
        subcategories: newFilters.subcategories,
        suppliers: newFilters.suppliers,
        statuses: newFilters.statuses,
      });
      syncFiltersToUrl(newFilters, tab ?? activeTab);
    },
    [setCatalogueFilters, syncFiltersToUrl, activeTab]
  );

  // Initialiser les filtres depuis l'URL au premier rendu
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const urlFilters = parseUrlFilters();
      const hasUrlFilters =
        urlFilters.search !== '' ||
        urlFilters.families.length > 0 ||
        urlFilters.categories.length > 0 ||
        urlFilters.subcategories.length > 0 ||
        urlFilters.suppliers.length > 0 ||
        urlFilters.statuses.length > 0;

      if (hasUrlFilters) {
        setCatalogueFilters({
          search: urlFilters.search,
          families: urlFilters.families,
          categories: urlFilters.categories,
          subcategories: urlFilters.subcategories,
          suppliers: urlFilters.suppliers,
          statuses: urlFilters.statuses,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One-time init from URL
  }, []);

  // Recherche debouncée (300ms) - se déclenche à chaque frappe
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string) => {
        const newFilters = { ...filtersRef.current, search: searchTerm };
        applyFilters(newFilters);
      }, 300),
    [applyFilters]
  );

  // Handler pour la recherche : déclenche le debounce à chaque frappe
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handler pour effacer la recherche
  const handleClearSearch = () => {
    setSearchInput('');
    const newFilters = { ...filters, search: '' };
    applyFilters(newFilters);
  };

  // Handler pour réinitialiser TOUS les filtres
  const handleResetAllFilters = () => {
    setSearchInput('');
    const emptyFilters: Filters = {
      search: '',
      families: [],
      categories: [],
      subcategories: [],
      suppliers: [],
      statuses: [],
    };
    applyFilters(emptyFilters);
  };

  // Vérifie si des filtres sont actifs
  const hasActiveFilters =
    filters.search !== '' ||
    filters.families.length > 0 ||
    filters.categories.length > 0 ||
    filters.subcategories.length > 0 ||
    filters.suppliers.length > 0 ||
    filters.statuses.length > 0;

  // useRef pour éviter dépendances instables (pattern MEMORY.md)
  const filtersRef = useRef(filters);
  const loadArchivedProductsRef = useRef(loadArchivedProducts);
  const loadIncompleteProductsRef = useRef(loadIncompleteProducts);

  // Garder les refs à jour
  useEffect(() => {
    filtersRef.current = filters;
    loadArchivedProductsRef.current = loadArchivedProducts;
    loadIncompleteProductsRef.current = loadIncompleteProducts;
  });

  // Charger le compteur incomplets au montage (pour le badge dans l'onglet)
  useEffect(() => {
    const loadCount = async () => {
      try {
        const result = await loadIncompleteProductsRef.current({ limit: 1 });
        setIncompleteTotal(result.total);
      } catch (error) {
        console.error('Erreur compteur incomplets:', error);
      }
    };
    void loadCount().catch(() => {
      /* handled above */
    });
  }, []);

  // Charger les produits archivés/incomplets quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'archived') {
      const loadData = async () => {
        setArchivedLoading(true);
        try {
          const result = await loadArchivedProductsRef.current(
            filtersRef.current
          );
          setArchivedProducts(result.products as Product[]);
        } catch (error) {
          console.error('Erreur chargement produits archivés:', error);
        } finally {
          setArchivedLoading(false);
        }
      };

      void loadData().catch(error => {
        console.error('[Catalogue] loadData failed:', error);
      });
    }

    if (activeTab === 'incomplete') {
      const loadData = async () => {
        setIncompleteLoading(true);
        try {
          const result = await loadIncompleteProductsRef.current({
            ...filtersRef.current,
            page: incompletePage,
          });
          setIncompleteProducts(result.products as Product[]);
          setIncompleteTotal(result.total);
        } catch (error) {
          console.error('Erreur chargement produits incomplets:', error);
        } finally {
          setIncompleteLoading(false);
        }
      };

      void loadData().catch(error => {
        console.error('[Catalogue] loadIncomplete failed:', error);
      });
    }
  }, [activeTab, incompletePage]);

  // Listener global ⌘K pour CommandPalette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Préparer les items pour CommandPalette
  const searchItems: SearchItem[] = useMemo(() => {
    return products.map(product => ({
      id: product.id,
      type: 'product' as const,
      title: product.name,
      subtitle: product.sku ?? undefined,
      url: `/produits/${product.id}`,
    }));
  }, [products]);

  // Handler sélection item CommandPalette
  const handleSearchSelect = (item: SearchItem) => {
    router.push(item.url);
    setPaletteOpen(false);
  };

  // Le filtrage est maintenant géré par le hook useCatalogue + CatalogueFilterPanel

  // Handler unifié pour CatalogueFilterPanel
  const handleFiltersChange = (newFilterState: FilterState) => {
    const newFilters: Filters = {
      search: newFilterState.search,
      families: newFilterState.families,
      categories: newFilterState.categories,
      subcategories: newFilterState.subcategories,
      suppliers: newFilterState.suppliers,
      statuses: newFilterState.statuses,
    };
    applyFilters(newFilters);
  };

  // Quick-Complete: ouvrir modale/dialog pour le champ manquant
  const handleQuickEdit = useCallback(
    (product: Product, field: QuickEditField) => {
      setQuickEditTarget({ product, field });
      if (field === 'price') {
        setQuickEditPrice('');
      }
      if (field === 'weight') {
        setQuickEditWeight('');
      }
      if (field === 'dimensions') {
        setQuickEditDimensions({ length: '', width: '', height: '' });
      }
    },
    []
  );

  // Quick-Complete: rafraîchir après save inline
  const handleProductUpdated = useCallback(async () => {
    setQuickEditTarget(null);
    if (activeTab === 'incomplete') {
      try {
        const result = await loadIncompleteProductsRef.current({
          ...filtersRef.current,
          page: incompletePage,
        });
        setIncompleteProducts(result.products as Product[]);
        setIncompleteTotal(result.total);
      } catch (err) {
        console.error('[Catalogue] Refresh incompletes failed:', err);
      }
    }
  }, [activeTab, incompletePage]);

  // Quick-Complete: save fournisseur inline
  const handleQuickEditSupplier = useCallback(
    async (supplierId: string | null) => {
      if (!quickEditTarget || !supplierId) return;
      setQuickEditSaving(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('products')
          .update({ supplier_id: supplierId })
          .eq('id', quickEditTarget.product.id);
        if (error) throw error;
        await handleProductUpdated();
        const supplierName =
          allSuppliers.find(s => s.id === supplierId)?.trade_name ??
          allSuppliers.find(s => s.id === supplierId)?.legal_name ??
          'Fournisseur';
        toast.success('Fournisseur assigné', {
          description: `${supplierName} assigné à ${quickEditTarget.product.name ?? 'ce produit'}.`,
        });
      } catch (err) {
        console.error('[QuickEdit] Supplier save failed:', err);
        toast.error("Impossible d'assigner le fournisseur.");
      } finally {
        setQuickEditSaving(false);
      }
    },
    [quickEditTarget, handleProductUpdated, allSuppliers]
  );

  // Quick-Complete: save prix inline (bloqué si PMP calculé via PO)
  const handleQuickEditPriceSave = useCallback(async () => {
    if (!quickEditTarget) return;
    // Garde-fou : bloquer si le prix est calculé automatiquement par PMP
    if ((quickEditTarget.product.cost_price_count ?? 0) > 0) {
      toast.error('Prix verrouillé', {
        description:
          'Ce prix est calculé automatiquement depuis les commandes fournisseur (PMP).',
      });
      return;
    }
    const priceValue = parseFloat(quickEditPrice);
    if (isNaN(priceValue) || priceValue < 0) return;
    setQuickEditSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ cost_price: priceValue })
        .eq('id', quickEditTarget.product.id);
      if (error) throw error;
      await handleProductUpdated();
      toast.success('Prix enregistré', {
        description: `Prix d'achat mis à jour pour ${quickEditTarget.product.name ?? 'ce produit'}.`,
      });
    } catch (err) {
      console.error('[QuickEdit] Price save failed:', err);
      toast.error("Impossible d'enregistrer le prix.");
    } finally {
      setQuickEditSaving(false);
    }
  }, [quickEditTarget, quickEditPrice, handleProductUpdated]);

  // Quick-Complete: save poids inline
  const handleQuickEditWeightSave = useCallback(async () => {
    if (!quickEditTarget) return;
    const weightValue = parseFloat(quickEditWeight);
    if (isNaN(weightValue) || weightValue <= 0) return;
    setQuickEditSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ weight: weightValue })
        .eq('id', quickEditTarget.product.id);
      if (error) throw error;
      await handleProductUpdated();
      toast.success('Poids enregistré', {
        description: `${weightValue} kg pour ${quickEditTarget.product.name ?? 'ce produit'}.`,
      });
    } catch (err) {
      console.error('[QuickEdit] Weight save failed:', err);
      toast.error("Impossible d'enregistrer le poids.");
    } finally {
      setQuickEditSaving(false);
    }
  }, [quickEditTarget, quickEditWeight, handleProductUpdated]);

  // Quick-Complete: save dimensions inline
  const handleQuickEditDimensionsSave = useCallback(async () => {
    if (!quickEditTarget) return;
    const l = parseFloat(quickEditDimensions.length);
    const w = parseFloat(quickEditDimensions.width);
    const h = parseFloat(quickEditDimensions.height);
    if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) return;
    setQuickEditSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ dimensions: { length_cm: l, width_cm: w, height_cm: h } })
        .eq('id', quickEditTarget.product.id);
      if (error) throw error;
      await handleProductUpdated();
      const volume = ((l * w * h) / 1_000_000).toFixed(4);
      toast.success('Dimensions enregistrées', {
        description: `${l} × ${w} × ${h} cm (${volume} m³) pour ${quickEditTarget.product.name ?? 'ce produit'}.`,
      });
    } catch (err) {
      console.error('[QuickEdit] Dimensions save failed:', err);
      toast.error("Impossible d'enregistrer les dimensions.");
    } finally {
      setQuickEditSaving(false);
    }
  }, [quickEditTarget, quickEditDimensions, handleProductUpdated]);

  // Quick-Complete: callback après CategorizeModal — persist subcategory to DB
  const handleQuickEditSubcategory = useCallback(
    async (updatedProduct: Product) => {
      if (!updatedProduct.subcategory_id) return;
      setQuickEditSaving(true);
      try {
        const supabase = createClient();
        const { error: dbError } = await supabase
          .from('products')
          .update({ subcategory_id: updatedProduct.subcategory_id })
          .eq('id', updatedProduct.id);
        if (dbError) throw dbError;
        await handleProductUpdated();
        const subcatName =
          subcategories.find(s => s.id === updatedProduct.subcategory_id)
            ?.name ?? 'Sous-catégorie';
        toast.success('Sous-catégorie assignée', {
          description: `${subcatName} assignée à ${updatedProduct.name ?? 'ce produit'}.`,
        });
      } catch (err) {
        console.error('[QuickEdit] Subcategory save failed:', err);
        toast.error("Impossible d'enregistrer la sous-catégorie.");
      } finally {
        setQuickEditSaving(false);
      }
    },
    [handleProductUpdated, subcategories]
  );

  // Gestion des actions produits
  const handleArchiveProduct = async (product: Product) => {
    try {
      if (product.archived_at) {
        await unarchiveProduct(product.id);
        console.warn('✅ Produit restauré:', product.name);
        // Rafraîchir la liste des archivés après restauration
        if (activeTab === 'archived') {
          const result = await loadArchivedProductsRef.current(
            filtersRef.current
          );
          setArchivedProducts(result.products as Product[]);
        }
      } else {
        await archiveProduct(product.id);
        console.warn('✅ Produit archivé:', product.name);
        // Retirer le produit de la liste incomplete si on est sur cet onglet
        if (activeTab === 'incomplete') {
          setIncompleteProducts(prev => prev.filter(p => p.id !== product.id));
        }
        // Rafraîchir la liste des archivés après archivage
        if (activeTab === 'archived') {
          const result = await loadArchivedProductsRef.current(
            filtersRef.current
          );
          setArchivedProducts(result.products as Product[]);
        }
        toast.success('Produit archivé', {
          description: `${product.name ?? 'Ce produit'} a été archivé.`,
        });
      }
    } catch (error) {
      console.error('❌ Erreur archivage produit:', error);
      toast.error("Impossible d'archiver le produit.");
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${product.name}" ?\n\nCette action est irréversible !`
    );

    if (confirmed) {
      try {
        await deleteProduct(product.id);
        console.warn('✅ Produit supprimé définitivement:', product.name);
      } catch (error) {
        console.error('❌ Erreur suppression produit:', error);
      }
    }
  };

  // Pagination incomplete tab (client-side, même ITEMS_PER_PAGE=24 que le hook)
  const incompleteTotalPages = Math.max(
    1,
    Math.ceil(incompleteTotal / itemsPerPage)
  );
  const incompleteHasNextPage = incompletePage < incompleteTotalPages;
  const incompleteHasPreviousPage = incompletePage > 1;

  // Validation SLO dashboard
  const dashboardSLO = checkSLOCompliance(startTime, 'dashboard');

  // Gestion des états de chargement et erreur
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black opacity-70">Chargement du catalogue...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec indicateur performance */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-light text-black">Catalogue Produits</h1>

        {/* Actions et indicateur SLO performance */}
        <div className="flex items-center space-x-4">
          {/* Boutons de création */}
          <div className="flex items-center space-x-2">
            <ButtonUnified
              onClick={() => router.push('/produits/sourcing')}
              variant="outline"
              size="sm"
              icon={Zap}
              iconPosition="left"
              className="h-8 text-xs"
            >
              Sourcing Rapide
            </ButtonUnified>

            <ButtonUnified
              onClick={() => router.push('/produits/catalogue/nouveau')}
              variant="default"
              size="sm"
              icon={Plus}
              iconPosition="left"
              className="h-8 text-xs"
            >
              Nouveau Produit
            </ButtonUnified>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant={dashboardSLO.isCompliant ? 'success' : 'destructive'}
            >
              {dashboardSLO.duration}ms
            </Badge>
            <span className="text-xs text-black opacity-50">SLO: &lt;2s</span>
          </div>
        </div>
      </div>

      {/* Contenu principal catalogue */}
      <div className="space-y-6">
        {/* Onglets produits actifs/incomplets/archivés */}
        <div className="flex border-b border-black">
          <button
            onClick={() => {
              setActiveTab('active');
              syncFiltersToUrl(filters, 'active');
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'active'
                ? 'border-b-2 border-black text-black'
                : 'text-black opacity-60 hover:opacity-80'
            }`}
          >
            Produits Actifs ({total})
          </button>
          <button
            onClick={() => {
              setActiveTab('incomplete');
              setIncompletePage(1);
              syncFiltersToUrl(filters, 'incomplete');
            }}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'incomplete'
                ? 'border-b-2 border-black text-black'
                : 'text-black opacity-60 hover:opacity-80'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-orange-500" />À compléter
            {incompleteTotal > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[10px] px-1.5 py-0">
                {incompleteTotal}
              </Badge>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('archived');
              syncFiltersToUrl(filters, 'archived');
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'archived'
                ? 'border-b-2 border-black text-black'
                : 'text-black opacity-60 hover:opacity-80'
            }`}
          >
            Produits Archivés ({archivedProducts.length})
          </button>
        </div>

        {/* Filtres horizontaux + Recherche + Toggle vue */}
        <div className="flex items-start gap-4">
          {/* Panneau de filtres */}
          <CatalogueFilterPanel
            families={families}
            categories={allCategories.filter(
              (c): c is typeof c & { family_id: string } => c.family_id !== null
            )}
            subcategories={subcategories}
            products={products}
            suppliers={allSuppliers}
            filters={{
              search: filters.search,
              families: filters.families,
              categories: filters.categories,
              subcategories: filters.subcategories,
              suppliers: filters.suppliers,
              statuses: filters.statuses,
            }}
            onFiltersChange={handleFiltersChange}
            className="flex-1"
          />

          {/* Recherche + Actions + Toggle vue alignés à droite */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Barre de recherche avec auto-search (debounce 300ms) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchInput}
                onChange={handleSearchChange}
                className={cn(
                  'w-56 border border-black bg-white py-2 pl-10 text-sm text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
                  searchInput ? 'pr-8' : 'pr-3'
                )}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-black opacity-50 hover:opacity-100 transition-opacity"
                  title="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Bouton Réinitialiser tous les filtres */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="flex items-center gap-1.5 h-[38px] px-3 border border-black bg-white text-black hover:bg-gray-100 transition-colors text-sm"
                title="Réinitialiser tous les filtres"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            )}

            {/* Toggle vue */}
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              variant="outline"
            />
          </div>
        </div>

        {/* Résultats */}
        <div className="space-y-4">
          {/* Gestion du chargement et erreurs */}
          {(activeTab === 'active' && loading) ||
          (activeTab === 'incomplete' && incompleteLoading) ||
          (activeTab === 'archived' && archivedLoading) ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-black opacity-70">Chargement...</div>
            </div>
          ) : (
            <>
              {/* Compteur résultats avec pagination */}
              {/* Texte explicatif pour onglet incomplets */}
              {activeTab === 'incomplete' && (
                <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2 mb-3">
                  Produits sans fournisseur, sous-catégorie, prix d&apos;achat,
                  photo, dimensions ou poids. Complétez-les pour améliorer la
                  qualité du catalogue.
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-black opacity-70">
                <span>
                  {activeTab === 'active' &&
                    `${total} produit${total > 1 ? 's' : ''} actif${total > 1 ? 's' : ''} - Page ${currentPage} sur ${totalPages}`}
                  {activeTab === 'incomplete' &&
                    `${incompleteTotal} produit${incompleteTotal > 1 ? 's' : ''} à compléter${incompleteTotalPages > 1 ? ` - Page ${incompletePage} sur ${incompleteTotalPages}` : ''}`}
                  {activeTab === 'archived' &&
                    `${archivedProducts.length} produit${archivedProducts.length > 1 ? 's' : ''} archivé${archivedProducts.length > 1 ? 's' : ''}`}
                </span>
                <span className="flex items-center gap-4">
                  {filters.search && <span>Recherche: "{filters.search}"</span>}
                  {activeTab === 'active' && totalPages > 1 && (
                    <span className="text-xs">
                      Affichage {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, total)} sur {total}
                    </span>
                  )}
                  {activeTab === 'incomplete' && incompleteTotalPages > 1 && (
                    <span className="text-xs">
                      Affichage {(incompletePage - 1) * itemsPerPage + 1}-
                      {Math.min(incompletePage * itemsPerPage, incompleteTotal)}{' '}
                      sur {incompleteTotal}
                    </span>
                  )}
                </span>
              </div>

              {/* Grille produits */}
              {(() => {
                const currentProducts =
                  activeTab === 'active'
                    ? products
                    : activeTab === 'incomplete'
                      ? incompleteProducts
                      : archivedProducts;

                return viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentProducts.map((product, index) => {
                      // 🚀 PERF FIX 2026-01-30: Utiliser batch image si dispo
                      const preloadedImage =
                        activeTab === 'active'
                          ? getPrimaryImage(product.id)
                          : activeTab === 'incomplete'
                            ? getIncompletePrimaryImage(product.id)
                            : null;

                      return (
                        <ProductCard
                          key={product.id}
                          product={
                            {
                              ...product,
                              supplier: product.supplier
                                ? {
                                    ...product.supplier,
                                    slug: (
                                      product.supplier.trade_name ??
                                      product.supplier.legal_name
                                    )
                                      .toLowerCase()
                                      .replace(/\s+/g, '-'),
                                    is_active: true,
                                  }
                                : undefined,
                            } as Product
                          }
                          index={index}
                          preloadedImage={preloadedImage}
                          incompleteMode={activeTab === 'incomplete'}
                          onQuickEdit={handleQuickEdit}
                          onArchive={product => {
                            void handleArchiveProduct(product).catch(error => {
                              console.error(
                                '[Catalogue] handleArchiveProduct failed:',
                                error
                              );
                            });
                          }}
                          onDelete={product => {
                            void handleDeleteProduct(product).catch(error => {
                              console.error(
                                '[Catalogue] handleDeleteProduct failed:',
                                error
                              );
                            });
                          }}
                          archived={!!product.archived_at}
                        />
                      );
                    })}
                  </div>
                ) : (
                  // Vue liste avec images - COMPACT
                  <div className="space-y-2">
                    {currentProducts.map(product => {
                      // Hook pour charger l'image
                      const ProductListItem = () => {
                        const { primaryImage, loading: imageLoading } =
                          useProductImages({
                            productId: product.id,
                            autoFetch: true,
                          });

                        return (
                          <div
                            key={product.id}
                            className="card-verone p-3 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() =>
                              router.push(`/produits/catalogue/${product.id}`)
                            }
                          >
                            <div className="flex items-center space-x-3">
                              {/* Image produit */}
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                                {primaryImage?.public_url && !imageLoading ? (
                                  <Image
                                    src={primaryImage.public_url}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm text-black truncate hover:underline">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-black opacity-70">
                                  {product.sku}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-semibold text-sm text-black">
                                  {product.cost_price != null
                                    ? `${product.cost_price.toFixed(2)} € HT`
                                    : 'Prix non défini'}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5 justify-end">
                                  <Badge className="text-[10px] px-1.5 py-0">
                                    {(() => {
                                      const labels: Record<string, string> = {
                                        active: '✓ Actif',
                                        preorder: '📅 Précommande',
                                        discontinued: '⚠ Arrêté',
                                        draft: '📝 Brouillon',
                                      };
                                      return (
                                        labels[product.product_status] ||
                                        product.product_status
                                      );
                                    })()}
                                  </Badge>
                                  {product.product_type === 'custom' && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] px-1.5 py-0"
                                    >
                                      Sur mesure
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      };

                      return <ProductListItem key={product.id} />;
                    })}
                  </div>
                );
              })()}

              {/* État vide */}
              {(() => {
                const currentProducts =
                  activeTab === 'active'
                    ? products
                    : activeTab === 'incomplete'
                      ? incompleteProducts
                      : archivedProducts;
                const isEmpty = currentProducts.length === 0;

                const emptyMessages: Record<
                  string,
                  { title: string; subtitle: string }
                > = {
                  active: {
                    title: 'Aucun produit actif trouvé',
                    subtitle: 'Essayez de modifier vos critères de recherche',
                  },
                  incomplete: {
                    title: 'Tous les produits sont complets',
                    subtitle:
                      'Aucun produit ne manque de fournisseur, sous-catégorie, prix, photo, dimensions ou poids',
                  },
                  archived: {
                    title: 'Aucun produit archivé trouvé',
                    subtitle: 'Les produits archivés apparaîtront ici',
                  },
                };

                const msg = emptyMessages[activeTab];

                return (
                  isEmpty && (
                    <div className="text-center py-12">
                      <div className="text-black opacity-50 text-lg">
                        {msg.title}
                      </div>
                      <p className="text-black opacity-30 text-sm mt-2">
                        {msg.subtitle}
                      </p>
                    </div>
                  )
                );
              })()}

              {/* Pagination */}
              {activeTab === 'active' && totalPages > 1 && (
                <div className="mt-8 pb-4">
                  <Pagination>
                    <PaginationContent>
                      {/* Bouton Précédent */}
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => hasPreviousPage && previousPage()}
                          className={cn(
                            'cursor-pointer',
                            !hasPreviousPage && 'pointer-events-none opacity-50'
                          )}
                        />
                      </PaginationItem>

                      {/* Première page */}
                      {currentPage > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => goToPage(1)}
                              isActive={currentPage === 1}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}

                      {/* Pages autour de la page courante */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          if (pageNum < 1 || pageNum > totalPages) return null;
                          if (pageNum === 1 && currentPage > 2) return null;
                          if (
                            pageNum === totalPages &&
                            currentPage < totalPages - 1
                          )
                            return null;

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => goToPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      {/* Dernière page */}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => goToPage(totalPages)}
                              isActive={currentPage === totalPages}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      {/* Bouton Suivant */}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => hasNextPage && nextPage()}
                          className={cn(
                            'cursor-pointer',
                            !hasNextPage && 'pointer-events-none opacity-50'
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Pagination incomplete */}
              {activeTab === 'incomplete' && incompleteTotalPages > 1 && (
                <div className="mt-8 pb-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            incompleteHasPreviousPage &&
                            setIncompletePage(p => p - 1)
                          }
                          className={cn(
                            'cursor-pointer',
                            !incompleteHasPreviousPage &&
                              'pointer-events-none opacity-50'
                          )}
                        />
                      </PaginationItem>

                      {incompletePage > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setIncompletePage(1)}
                              isActive={incompletePage === 1}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {incompletePage > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}

                      {Array.from(
                        { length: Math.min(5, incompleteTotalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (incompleteTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (incompletePage <= 3) {
                            pageNum = i + 1;
                          } else if (
                            incompletePage >=
                            incompleteTotalPages - 2
                          ) {
                            pageNum = incompleteTotalPages - 4 + i;
                          } else {
                            pageNum = incompletePage - 2 + i;
                          }

                          if (pageNum < 1 || pageNum > incompleteTotalPages)
                            return null;
                          if (pageNum === 1 && incompletePage > 2) return null;
                          if (
                            pageNum === incompleteTotalPages &&
                            incompletePage < incompleteTotalPages - 1
                          )
                            return null;

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setIncompletePage(pageNum)}
                                isActive={incompletePage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      {incompletePage < incompleteTotalPages - 1 && (
                        <>
                          {incompletePage < incompleteTotalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() =>
                                setIncompletePage(incompleteTotalPages)
                              }
                              isActive={incompletePage === incompleteTotalPages}
                            >
                              {incompleteTotalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            incompleteHasNextPage &&
                            setIncompletePage(p => p + 1)
                          }
                          className={cn(
                            'cursor-pointer',
                            !incompleteHasNextPage &&
                              'pointer-events-none opacity-50'
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick-Complete: Dialog fournisseur */}
      <Dialog
        open={quickEditTarget?.field === 'supplier'}
        onOpenChange={open => {
          if (!open) setQuickEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un fournisseur</DialogTitle>
            <DialogDescription>
              {quickEditTarget?.product.name}
            </DialogDescription>
          </DialogHeader>
          <SupplierSelector
            selectedSupplierId={null}
            onSupplierChange={supplierId => {
              void handleQuickEditSupplier(supplierId).catch(err => {
                console.error('[QuickEdit] Supplier change failed:', err);
              });
            }}
            disabled={quickEditSaving}
            label="Fournisseur"
            placeholder="Sélectionner un fournisseur..."
          />
          {quickEditSaving && (
            <p className="text-sm text-gray-500">Enregistrement...</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick-Complete: Dialog prix */}
      <Dialog
        open={quickEditTarget?.field === 'price'}
        onOpenChange={open => {
          if (!open) setQuickEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Prix d&apos;achat HT</DialogTitle>
            <DialogDescription>
              {quickEditTarget?.product.name}
            </DialogDescription>
          </DialogHeader>
          {(quickEditTarget?.product.cost_price_count ?? 0) > 0 ? (
            /* Prix verrouillé — calculé automatiquement par PMP */
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm text-blue-800">
                Prix calculé automatiquement depuis{' '}
                {quickEditTarget?.product.cost_price_count} commande
                {(quickEditTarget?.product.cost_price_count ?? 0) > 1
                  ? 's'
                  : ''}{' '}
                fournisseur (PMP).
              </div>
              {quickEditTarget?.product.cost_price != null && (
                <div className="text-center text-lg font-semibold text-black">
                  {quickEditTarget.product.cost_price.toFixed(2)} € HT
                </div>
              )}
            </div>
          ) : (
            /* Prix modifiable manuellement */
            <>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quickEditPrice}
                  onChange={e => setQuickEditPrice(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      void handleQuickEditPriceSave().catch(err => {
                        console.error('[QuickEdit] Price save failed:', err);
                      });
                    }
                  }}
                />
                <span className="text-sm text-gray-500">€ HT</span>
              </div>
              <ButtonUnified
                onClick={() => {
                  void handleQuickEditPriceSave().catch(err => {
                    console.error('[QuickEdit] Price save failed:', err);
                  });
                }}
                disabled={
                  quickEditSaving ||
                  !quickEditPrice ||
                  isNaN(parseFloat(quickEditPrice))
                }
                variant="default"
                size="sm"
                className="w-full"
              >
                {quickEditSaving ? 'Enregistrement...' : 'Enregistrer'}
              </ButtonUnified>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick-Complete: Dialog poids */}
      <Dialog
        open={quickEditTarget?.field === 'weight'}
        onOpenChange={open => {
          if (!open) setQuickEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Weight className="h-5 w-5" />
              Poids du produit
            </DialogTitle>
            <DialogDescription>
              {quickEditTarget?.product.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={quickEditWeight}
              onChange={e => setQuickEditWeight(e.target.value)}
              placeholder="0.00"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  void handleQuickEditWeightSave().catch(err => {
                    console.error('[QuickEdit] Weight save failed:', err);
                  });
                }
              }}
            />
            <span className="text-sm text-gray-500">kg</span>
          </div>
          <ButtonUnified
            onClick={() => {
              void handleQuickEditWeightSave().catch(err => {
                console.error('[QuickEdit] Weight save failed:', err);
              });
            }}
            disabled={
              quickEditSaving ||
              !quickEditWeight ||
              isNaN(parseFloat(quickEditWeight)) ||
              parseFloat(quickEditWeight) <= 0
            }
            variant="default"
            size="sm"
            className="w-full"
          >
            {quickEditSaving ? 'Enregistrement...' : 'Enregistrer'}
          </ButtonUnified>
        </DialogContent>
      </Dialog>

      {/* Quick-Complete: Dialog dimensions */}
      <Dialog
        open={quickEditTarget?.field === 'dimensions'}
        onOpenChange={open => {
          if (!open) setQuickEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Dimensions du produit
            </DialogTitle>
            <DialogDescription>
              {quickEditTarget?.product.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Longueur
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quickEditDimensions.length}
                    onChange={e =>
                      setQuickEditDimensions(prev => ({
                        ...prev,
                        length: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    autoFocus
                  />
                  <span className="text-xs text-gray-400">cm</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Largeur
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quickEditDimensions.width}
                    onChange={e =>
                      setQuickEditDimensions(prev => ({
                        ...prev,
                        width: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <span className="text-xs text-gray-400">cm</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Hauteur
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quickEditDimensions.height}
                    onChange={e =>
                      setQuickEditDimensions(prev => ({
                        ...prev,
                        height: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        void handleQuickEditDimensionsSave().catch(err => {
                          console.error(
                            '[QuickEdit] Dimensions save failed:',
                            err
                          );
                        });
                      }
                    }}
                  />
                  <span className="text-xs text-gray-400">cm</span>
                </div>
              </div>
            </div>
            {/* Volume calculé en temps réel */}
            {quickEditDimensions.length &&
              quickEditDimensions.width &&
              quickEditDimensions.height && (
                <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 text-center">
                  Volume :{' '}
                  <span className="font-semibold">
                    {(
                      (parseFloat(quickEditDimensions.length) *
                        parseFloat(quickEditDimensions.width) *
                        parseFloat(quickEditDimensions.height)) /
                      1_000_000
                    ).toFixed(4)}
                  </span>{' '}
                  m³
                </div>
              )}
          </div>
          <ButtonUnified
            onClick={() => {
              void handleQuickEditDimensionsSave().catch(err => {
                console.error('[QuickEdit] Dimensions save failed:', err);
              });
            }}
            disabled={
              quickEditSaving ||
              !quickEditDimensions.length ||
              !quickEditDimensions.width ||
              !quickEditDimensions.height ||
              isNaN(parseFloat(quickEditDimensions.length)) ||
              isNaN(parseFloat(quickEditDimensions.width)) ||
              isNaN(parseFloat(quickEditDimensions.height)) ||
              parseFloat(quickEditDimensions.length) <= 0 ||
              parseFloat(quickEditDimensions.width) <= 0 ||
              parseFloat(quickEditDimensions.height) <= 0
            }
            variant="default"
            size="sm"
            className="w-full"
          >
            {quickEditSaving ? 'Enregistrement...' : 'Enregistrer'}
          </ButtonUnified>
        </DialogContent>
      </Dialog>

      {/* Quick-Complete: CategorizeModal (sous-catégorie) */}
      {quickEditTarget?.field === 'subcategory' && (
        <CategoryHierarchyModal
          isOpen={true}
          onClose={() => setQuickEditTarget(null)}
          product={quickEditTarget.product}
          onUpdate={updatedProduct => {
            void handleQuickEditSubcategory(updatedProduct as Product).catch(
              err => {
                console.error('[QuickEdit] Subcategory update failed:', err);
              }
            );
          }}
        />
      )}

      {/* Quick-Complete: ProductPhotosModal */}
      {quickEditTarget?.field === 'photo' && (
        <ProductPhotosModal
          isOpen={true}
          onClose={() => setQuickEditTarget(null)}
          productId={quickEditTarget.product.id}
          productName={quickEditTarget.product.name}
          productType={
            quickEditTarget.product.product_status === 'draft'
              ? 'draft'
              : 'product'
          }
          onImagesUpdated={() => {
            void handleProductUpdated()
              .then(() => {
                toast.success('Photo enregistrée', {
                  description: 'La photo du produit a été mise à jour.',
                });
              })
              .catch(err => {
                console.error('[QuickEdit] Photos updated failed:', err);
              });
          }}
        />
      )}

      {/* CommandPalette global ⌘K */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={handleSearchSelect}
        items={searchItems}
      />
    </div>
  );
}
