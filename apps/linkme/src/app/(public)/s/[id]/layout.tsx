'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';
import { Check, ShoppingCart } from 'lucide-react';

import { OrderFormUnified } from '@/components/OrderFormUnified';
import type { CartItem as UnifiedCartItem } from '@/components/OrderFormUnified';
import { SelectionHero } from '@/components/public-selection';
import { useEnseigneOrganisations } from '@/lib/hooks/use-enseigne-organisations';
import { useSubmitUnifiedOrder } from '@/lib/hooks/use-submit-unified-order';

import {
  DEFAULT_BRANDING,
  SelectionContext,
  type IAffiliateInfo,
  type IBranding,
  type ICartItem,
  type ICategory,
  type ISelection,
  type ISelectionItem,
  type SelectionContextValue,
} from './selection-context';

const supabase: SupabaseClient<Database> = createClient();

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

interface SelectionLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function SelectionLayout({
  children,
  params,
}: SelectionLayoutProps) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();

  const [selection, setSelection] = useState<ISelection | null>(null);
  const [items, setItems] = useState<ISelectionItem[]>([]);
  const [branding, setBranding] = useState<IBranding>(DEFAULT_BRANDING);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [affiliateInfo, setAffiliateInfo] = useState<IAffiliateInfo | null>(
    null
  );

  // Fetch enseigne organisations
  const { data: organisations = [] } = useEnseigneOrganisations(
    selection?.affiliate_id ?? null
  );

  const { submitOrder, isSubmitting } = useSubmitUnifiedOrder();

  // Fetch selection data
  useEffect(() => {
    async function fetchSelection() {
      setIsLoading(true);
      setError(null);

      try {
        const { data: selectionData, error: selectionError } = await supabase
          .from('linkme_selections')
          .select('*')
          .eq('id', id)
          .single<ISelection>();

        if (selectionError || !selectionData) {
          setError('Selection non trouvee');
          setIsLoading(false);
          return;
        }

        if (!selectionData.published_at) {
          setError("Cette selection n'est pas encore publiee");
          setIsLoading(false);
          return;
        }

        setSelection(selectionData);

        /**
         * Type pour affiliate avec JOIN enseignes
         */
        interface AffiliateWithEnseigne {
          display_name: string;
          enseigne_id: string | null;
          enseignes: {
            name: string;
          } | null;
        }

        // Fetch affiliate info
        const { data: affiliateData } = await supabase
          .from('linkme_affiliates')
          .select('display_name, enseigne_id, enseignes(name)')
          .eq('id', selectionData.affiliate_id)
          .single<AffiliateWithEnseigne>();

        if (affiliateData) {
          setAffiliateInfo({
            role: affiliateData.enseigne_id ? 'enseigne' : null,
            enseigne_id: affiliateData.enseigne_id,
            enseigne_name: affiliateData.enseignes?.name ?? null,
          });
        }

        // Fetch items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: itemsData, error: itemsError } = await (supabase as any)
          .from('linkme_selection_items_with_pricing')
          .select('*')
          .eq('selection_id', id);

        if (itemsError) {
          console.error('Error fetching items:', itemsError);
        } else {
          setItems((itemsData ?? []) as ISelectionItem[]);
        }

        /**
         * Type pour branding
         */
        interface BrandingRow {
          primary_color: string | null;
          secondary_color: string | null;
          accent_color: string | null;
          text_color: string | null;
          background_color: string | null;
          logo_url: string | null;
        }

        // Fetch branding
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: brandingData } = await (supabase as any)
          .from('linkme_affiliate_branding')
          .select('*')
          .eq('affiliate_id', selectionData.affiliate_id)
          .single();

        if (brandingData) {
          setBranding({
            primary_color:
              brandingData.primary_color ?? DEFAULT_BRANDING.primary_color,
            secondary_color:
              brandingData.secondary_color ?? DEFAULT_BRANDING.secondary_color,
            accent_color:
              brandingData.accent_color ?? DEFAULT_BRANDING.accent_color,
            text_color: brandingData.text_color ?? DEFAULT_BRANDING.text_color,
            background_color:
              brandingData.background_color ??
              DEFAULT_BRANDING.background_color,
            logo_url: brandingData.logo_url,
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Une erreur inattendue est survenue');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchSelection();
  }, [id]);

  // Cart functions
  const addToCart = useCallback((item: ISelectionItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is ICartItem => item !== null);
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.selling_price_ttc * item.quantity,
      0
    );
  }, [cart]);

  const categories: ICategory[] = useMemo(() => {
    const catMap = new Map<string, ICategory>();

    items.forEach(item => {
      if (item.category_name) {
        const existing = catMap.get(item.category_name);
        if (existing) {
          existing.count += 1;
          if (item.subcategory_id && item.subcategory_name) {
            const subcat = existing.subcategories?.find(
              s => s.id === item.subcategory_id
            );
            if (subcat) {
              subcat.count += 1;
            } else {
              existing.subcategories = existing.subcategories || [];
              existing.subcategories.push({
                id: item.subcategory_id,
                name: item.subcategory_name,
                count: 1,
              });
            }
          }
        } else {
          catMap.set(item.category_name, {
            id: item.category_name,
            name: item.category_name,
            count: 1,
            subcategories:
              item.subcategory_id && item.subcategory_name
                ? [
                    {
                      id: item.subcategory_id,
                      name: item.subcategory_name,
                      count: 1,
                    },
                  ]
                : [],
          });
        }
      }
    });

    return Array.from(catMap.values());
  }, [items]);

  const handleOrderSubmit = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (data: any, cartItems: UnifiedCartItem[]) => {
      if (!selection) return;

      const result = await submitOrder({
        affiliateId: selection.affiliate_id,
        selectionId: selection.id,
        cart: cartItems,
        data: data,
      });

      if (result.success && result.orderNumber) {
        setOrderNumber(result.orderNumber);
      }
    },
    [selection, submitOrder]
  );

  // Navigation tabs
  const tabs = useMemo(() => {
    const baseTabs = [
      { label: 'Catalogue', href: `/s/${id}/catalogue` },
      { label: 'FAQ', href: `/s/${id}/faq` },
      { label: 'Contact', href: `/s/${id}/contact` },
    ];

    // Add points-de-vente only for enseignes
    if (affiliateInfo?.role === 'enseigne' && organisations.length > 0) {
      baseTabs.splice(1, 0, {
        label: 'Points de vente',
        href: `/s/${id}/points-de-vente`,
      });
    }

    return baseTabs;
  }, [id, affiliateInfo, organisations]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !selection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Selection non trouvee'}
          </h1>
          <p className="text-gray-600">Verifiez l'URL et reessayez.</p>
        </div>
      </div>
    );
  }

  const contextValue: SelectionContextValue = {
    selection,
    items,
    branding,
    cart,
    affiliateInfo,
    organisations,
    categories,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    setCart,
  };

  return (
    <SelectionContext.Provider value={contextValue}>
      <div
        className="min-h-screen"
        style={{ backgroundColor: branding.background_color }}
      >
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <h1
              className="text-2xl font-bold"
              style={{ color: branding.text_color }}
            >
              {selection.name}
            </h1>
          </div>
        </header>

        <SelectionHero
          name={selection.name}
          description={selection.description}
          imageUrl={selection.image_url}
          branding={branding}
          productCount={items.length}
        />

        {/* Navigation Tabs */}
        <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="container mx-auto px-4">
            <nav className="flex space-x-8">
              {tabs.map(tab => {
                const isActive = pathname === tab.href;
                return (
                  <button
                    key={tab.href}
                    onClick={() => router.push(tab.href)}
                    className={`py-4 px-2 font-medium text-sm transition-colors relative ${
                      isActive
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: branding.primary_color }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Page Content */}
        <main>{children}</main>

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

        {/* Order Form Modal */}
        {isOrderFormOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOrderFormOpen(false)}
            />
            <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl overflow-hidden">
              {orderNumber ? (
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  organisations={organisations as any}
                  onSubmit={handleOrderSubmit}
                  onClose={() => setIsOrderFormOpen(false)}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </SelectionContext.Provider>
  );
}
