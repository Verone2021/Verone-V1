'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { createClient } from '@verone/utils/supabase/client';
import { Check, Minus, Package, Plus, ShoppingCart, Star } from 'lucide-react';

import { OrderFormUnified } from '@/components/OrderFormUnified';
import type { CartItem as UnifiedCartItem } from '@/components/OrderFormUnified';
import {
  ContactForm,
  FAQSection,
  Pagination,
  ProductFilters,
  SelectionCategoryBar,
  SelectionCategoryDropdown,
  SelectionHeader,
  SelectionHero,
  StoreLocatorMap,
} from '@/components/public-selection';
import { useEnseigneOrganisations } from '@/lib/hooks/use-enseigne-organisations';
import { useSubmitUnifiedOrder } from '@/lib/hooks/use-submit-unified-order';

const supabase = createClient();

interface ISelectionPageProps {
  params: Promise<{ id: string }>;
}

interface ISelectionItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  base_price_ht: number;
  selling_price_ht: number;
  selling_price_ttc: number;
  margin_rate: number;
  stock_quantity: number;
  category_name: string | null;
  subcategory_id: string | null;
  subcategory_name: string | null;
  is_featured: boolean;
}

interface ISelection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_id: string;
  /** Timestamp de publication. null = non publie */
  published_at: string | null;
  created_at: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface IOrganisation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface IAffiliateInfo {
  role: string | null;
  enseigne_id: string | null;
  enseigne_name: string | null;
}

const DEFAULT_BRANDING: IBranding = {
  primary_color: '#5DBEBB',
  secondary_color: '#3976BB',
  accent_color: '#7E84C0',
  text_color: '#183559',
  background_color: '#FFFFFF',
  logo_url: null,
};

interface ICartItem extends ISelectionItem {
  quantity: number;
}

interface ICategory {
  id: string;
  name: string;
  count: number;
  subcategories?: { id: string; name: string; count: number }[];
}

interface INavItem {
  id: string;
  label: string;
  href: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export default function PublicSelectionPage({
  params,
}: ISelectionPageProps): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'catalogue';

  const [selection, setSelection] = useState<ISelection | null>(null);
  const [items, setItems] = useState<ISelectionItem[]>([]);
  const [branding, setBranding] = useState<IBranding>(DEFAULT_BRANDING);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // New states for navigation and filtering
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Affiliate info for conditional sections
  const [affiliateInfo, setAffiliateInfo] = useState<IAffiliateInfo | null>(
    null
  );

  // Hover state for category overlay
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [organisations, setOrganisations] = useState<IOrganisation[]>([]);


  // Hooks for unified order form
  const { submitOrder, isSubmitting } = useSubmitUnifiedOrder();
  const { data: enseigneOrgs = [] } = useEnseigneOrganisations(
    selection?.affiliate_id ?? null
  );

  // Track view
  const hasTrackedView = useRef(false);

  // Navigation items
  const navItems: INavItem[] = useMemo(
    () => [
      { id: 'catalogue', label: 'Catalogue', href: '?tab=catalogue' },
      {
        id: 'points-de-vente',
        label: 'Points de vente',
        href: '?tab=points-de-vente',
      },
      { id: 'faq', label: 'FAQ', href: '?tab=faq' },
      { id: 'contact', label: 'Contact', href: '?tab=contact' },
    ],
    []
  );

  // Extract categories with subcategories from items
  const categories: ICategory[] = useMemo(() => {
    const categoryMap = new Map<
      string,
      {
        count: number;
        subcategories: Map<string, { id: string; name: string; count: number }>;
      }
    >();

    for (const item of items) {
      const catName = item.category_name ?? 'Autres';
      const subId = item.subcategory_id;
      const subName = item.subcategory_name;

      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { count: 0, subcategories: new Map() });
      }

      const category = categoryMap.get(catName)!;
      category.count++;

      // Add subcategory if present
      if (subId && subName) {
        const existingSub = category.subcategories.get(subId);
        if (existingSub) {
          existingSub.count++;
        } else {
          category.subcategories.set(subId, { id: subId, name: subName, count: 1 });
        }
      }
    }

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count: data.count,
        subcategories: Array.from(data.subcategories.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Filter items based on search, category, and subcategory
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.product_name.toLowerCase().includes(query) ||
          item.product_sku.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      const categoryName = categories.find(
        c => c.id === selectedCategory
      )?.name;
      if (categoryName) {
        filtered = filtered.filter(
          item => (item.category_name ?? 'Autres') === categoryName
        );
      }
    }

    // Filter by subcategory
    if (selectedSubcategory) {
      filtered = filtered.filter(
        item => item.subcategory_id === selectedSubcategory
      );
    }

    return filtered;
  }, [items, searchQuery, selectedCategory, selectedSubcategory, categories]);

  // Pagination constants and calculations
  const PRODUCTS_PER_PAGE = 12; // 3 rows × 4 columns
  const totalPages = Math.ceil(filteredItems.length / PRODUCTS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSubcategory]);

  // Fetch selection data
  useEffect(() => {
    const fetchSelection = async (): Promise<void> => {
      try {
        // Detect if id is UUID or slug
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id
          );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const { data, error: rpcError } = await (supabase.rpc as any)(
          isUuid ? 'get_public_selection' : 'get_public_selection_by_slug',
          isUuid ? { p_selection_id: id } : { p_slug: id }
        );

        if (rpcError) throw rpcError;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!data?.success)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          throw new Error((data?.error as string) ?? 'Selection non trouvee');

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        setSelection(data.selection as ISelection);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        setItems((data.items as ISelectionItem[]) ?? []);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (data.branding) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          setBranding(data.branding as IBranding);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (data.affiliate_info) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          setAffiliateInfo(data.affiliate_info as IAffiliateInfo);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (data.organisations) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          setOrganisations(data.organisations as IOrganisation[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSelection();
  }, [id]);

  // Track view
  useEffect(() => {
    if (selection?.id && !hasTrackedView.current) {
      hasTrackedView.current = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      void (supabase.rpc as any)('track_selection_view', {
        p_selection_id: selection.id,
      });
    }
  }, [selection?.id]);

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: string): void => {
      router.push(`?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  const addToCart = (item: ISelectionItem): void => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number): void => {
    setCart(prev =>
      prev
        .map(c =>
          c.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter(c => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.selling_price_ttc * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Check if should show points de vente (only for enseigne_admin)
  const showPointsDeVente =
    affiliateInfo?.role === 'enseigne_admin' && organisations.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="w-48 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error ?? !selection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Selection introuvable
          </h1>
          <p className="text-gray-600">
            {error ?? "Cette selection n'existe pas ou n'est plus disponible."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SelectionHeader
        selectionName={selection.name}
        branding={branding}
        cartCount={cartCount}
        onCartClick={() => setIsOrderFormOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
        navItems={navItems}
        activeSection={activeTab}
        onNavClick={handleTabChange}
        showPointsDeVente={showPointsDeVente}
      />

      {/* Hero - Reduced height */}
      <SelectionHero
        name={selection.name}
        description={selection.description}
        imageUrl={selection.image_url}
        branding={branding}
        productCount={items.length}
      />

      {/* Search Bar (expandable) */}
      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        branding={branding}
        isSearchOpen={isSearchOpen}
        onSearchOpenChange={setIsSearchOpen}
      />

      {/* Category Bar */}
      <SelectionCategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        branding={branding}
        totalCount={items.length}
      />

      {/* Subcategory Dropdown (if category is selected and has subcategories) */}
      {selectedCategory && (
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <SelectionCategoryDropdown
              subcategories={
                categories.find(c => c.id === selectedCategory)
                  ?.subcategories ?? []
              }
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={setSelectedSubcategory}
              branding={branding}
            />
          </div>
        </div>
      )}

      {/* Catalogue Section */}
      {activeTab === 'catalogue' && (
        <div id="catalogue" className="scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Search results info */}
            {(searchQuery || selectedCategory) && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredItems.length} résultat
                  {filteredItems.length > 1 ? 's' : ''}
                  {searchQuery && ` pour "${searchQuery}"`}
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                    }}
                    className="text-sm font-medium hover:underline"
                    style={{ color: branding.primary_color }}
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            )}

            {/* Products Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map(item => {
                  const inCart = cart.find(c => c.id === item.id);
                  const isHovered = hoveredProductId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                      style={
                        item.is_featured
                          ? { boxShadow: `0 0 0 2px ${branding.accent_color}` }
                          : undefined
                      }
                      onMouseEnter={() => setHoveredProductId(item.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden group">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package className="h-16 w-16" />
                          </div>
                        )}

                        {/* Gradient Overlay on Hover */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                          }`}
                        />

                        {/* Category on Hover */}
                        {(item.category_name || item.subcategory_name) && (
                          <div
                            className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${
                              isHovered
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-4'
                            }`}
                          >
                            {item.category_name && (
                              <p className="text-white/80 text-xs uppercase tracking-wide">
                                {item.category_name}
                              </p>
                            )}
                            {item.subcategory_name && (
                              <p className="text-white font-semibold text-sm mt-0.5">
                                {item.subcategory_name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Badges Container */}
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                          {/* Featured Badge - Left */}
                          {item.is_featured && (
                            <span
                              className="text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm"
                              style={{ backgroundColor: branding.accent_color }}
                            >
                              <Star className="h-3 w-3 fill-current" />
                              Vedette
                            </span>
                          )}
                          {/* Spacer if no featured badge */}
                          {!item.is_featured && <span />}
                          {/* Stock Badge - Right */}
                          {item.stock_quantity > 0 ? (
                            <span
                              className="text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm"
                              style={{
                                backgroundColor: branding.primary_color,
                              }}
                            >
                              Stock: {item.stock_quantity}
                            </span>
                          ) : (
                            <span className="bg-amber-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                              Sur commande
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        {/* Product Name - Always visible */}
                        <h3
                          className="font-semibold text-sm line-clamp-2 mb-2"
                          style={{ color: branding.text_color }}
                        >
                          {item.product_name}
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">
                          {item.product_sku}
                        </p>

                        <div className="flex items-center justify-between">
                          {/* Price */}
                          <div>
                            <span
                              className="text-xl font-bold"
                              style={{ color: branding.text_color }}
                            >
                              {formatPrice(item.selling_price_ttc)}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              TTC
                            </span>
                          </div>

                          {/* Add to Cart / Quantity */}
                          {inCart ? (
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-6 text-center font-medium text-sm">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="flex items-center gap-1 text-white py-1.5 px-2.5 rounded-lg text-xs transition-colors hover:opacity-90"
                              style={{
                                backgroundColor: branding.primary_color,
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Ajouter
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  {searchQuery || selectedCategory
                    ? 'Aucun produit ne correspond à votre recherche'
                    : 'Aucun produit dans cette selection'}
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                    }}
                    className="mt-4 text-sm font-medium hover:underline"
                    style={{ color: branding.primary_color }}
                  >
                    Voir tous les produits
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                branding={branding}
              />
            )}
          </div>
        </div>
      )}

      {/* Points de vente Section - Only for enseignes */}
      {activeTab === 'points-de-vente' && showPointsDeVente && (
        <div id="stores" className="scroll-mt-20">
          <StoreLocatorMap
            organisations={organisations}
            branding={branding}
            enseigneName={affiliateInfo?.enseigne_name ?? selection.name}
          />
        </div>
      )}

      {/* FAQ Section */}
      {activeTab === 'faq' && (
        <div id="faq" className="scroll-mt-20">
          <FAQSection
            branding={branding}
            contactInfo={{
              name: selection.contact_name,
              email: selection.contact_email,
              phone: selection.contact_phone,
            }}
            selectionName={selection.name}
          />
        </div>
      )}

      {/* Contact Section */}
      {activeTab === 'contact' && (
        <div id="contact" className="scroll-mt-20">
          <ContactForm
            selectionId={selection.id}
            selectionName={selection.name}
            branding={branding}
          />
        </div>
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <button
          onClick={() => setIsOrderFormOpen(true)}
          className="fixed bottom-6 right-6 z-40 text-white px-6 py-4 rounded-full shadow-lg transition-all flex items-center gap-3 hover:opacity-90"
          style={{ backgroundColor: branding.primary_color }}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">
            {cartCount} article{cartCount > 1 ? 's' : ''}
          </span>
          <span className="font-bold">{formatPrice(cartTotal)}</span>
        </button>
      )}

      {/* Enseigne Stepper (Slide-over) */}
      {isOrderFormOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOrderFormOpen(false)}
          />

          {/* Panel - Large modal with rounded corners */}
          <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {orderNumber ? (
              /* Success State */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Commande envoyee !
                </h3>
                <p className="text-gray-600 mb-4">
                  Votre commande <strong>{orderNumber}</strong> a ete recue.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Elle sera validee par notre equipe sous 24h.
                </p>
                <button
                  onClick={() => {
                    setOrderNumber(null);
                    setIsOrderFormOpen(false);
                    setCart([]);
                  }}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90"
                  style={{ backgroundColor: branding.text_color }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <OrderFormUnified
                affiliateId={selection.affiliate_id}
                selectionId={selection.id}
                cart={cart.map(
                  (item): UnifiedCartItem => ({
                    id: item.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    product_sku: item.product_sku,
                    product_image: item.product_image,
                    selling_price_ht: item.selling_price_ht,
                    selling_price_ttc: item.selling_price_ttc,
                    margin_rate: item.margin_rate,
                    quantity: item.quantity,
                  })
                )}
                organisations={enseigneOrgs.map(org => ({
                  id: org.id,
                  legal_name: org.legal_name,
                  trade_name: org.trade_name,
                  city: org.city,
                }))}
                onClose={() => setIsOrderFormOpen(false)}
                onSubmit={async (data, cartItems) => {
                  const result = await submitOrder({
                    affiliateId: selection.affiliate_id,
                    selectionId: selection.id,
                    cart: cartItems,
                    data,
                  });

                  if (result.success) {
                    // Fermer le modal dans tous les cas de succès
                    setIsOrderFormOpen(false);

                    // Afficher le numéro de commande si disponible (nouveau restaurant uniquement)
                    if (result.orderNumber) {
                      setOrderNumber(result.orderNumber);
                    }

                    // Toast de succès déjà géré par le hook
                  } else {
                    // Erreur déjà affichée par le hook via toast
                    console.error(
                      '[Page] Order submission failed:',
                      result.error
                    );
                  }
                }}
                isSubmitting={isSubmitting}
                onUpdateQuantity={(itemId, newQuantity) => {
                  if (newQuantity < 1) return;
                  setCart(prev =>
                    prev.map(item =>
                      item.id === itemId
                        ? { ...item, quantity: newQuantity }
                        : item
                    )
                  );
                }}
                onRemoveItem={itemId => {
                  setCart(prev => prev.filter(item => item.id !== itemId));
                  if (cart.length === 1) {
                    setIsOrderFormOpen(false);
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
