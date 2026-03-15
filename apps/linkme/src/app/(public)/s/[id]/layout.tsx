'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';
import {
  Check,
  CheckCircle,
  Clock,
  Mail,
  Package,
  ShoppingCart,
  Store,
  Truck,
  User,
} from 'lucide-react';

import { OrderFormUnified } from '@/components/OrderFormUnified';
import type {
  CartItem as UnifiedCartItem,
  OrderFormUnifiedData,
} from '@/components/OrderFormUnified';
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
  const [submittedOrderData, setSubmittedOrderData] = useState<{
    requesterName: string;
    requesterEmail: string;
    restaurantName: string;
    isNewRestaurant: boolean;
    deliveryAddress: string;
    deliveryAsap: boolean;
    items: {
      name: string;
      sku: string;
      image: string | null;
      qty: number;
      priceTtc: number;
    }[];
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
  } | null>(null);
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
        /**
         * LOGIQUE CRITIQUE - NE PAS MODIFIER SANS REVIEW
         *
         * Cette détection UUID vs slug est ESSENTIELLE pour le routing des sélections publiques.
         *
         * Contexte :
         * - Dashboard LinkMe génère des liens avec SLUG (/s/collection-mobilier-pokawa)
         * - DB stocke id=UUID + slug=text dans linkme_selections
         * - Cette logique permet de supporter les 2 formats (UUID et slug)
         *
         * RPCs utilisés :
         * - get_public_selection(uuid) : Accès par UUID
         * - get_public_selection_by_slug(text) : Accès par slug
         *
         * Historique régressions :
         * - 2026-02-09 : Commit fa2cc973 a cassé cette logique → restaurée
         *
         * Tests :
         * - tests/e2e/linkme-public-selection.spec.ts
         *
         * Documentation :
         * - docs/critical/linkme-public-selection-routing.md
         *
         * @see https://github.com/Verone2021/verone-back-office/commit/3c8d51da
         */
        // Détecter UUID vs slug pour appeler le bon RPC
        // Pattern UUID : 8-4-4-4-12 caractères hexadécimaux
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id
          );

        /**
         * Type pour la réponse des RPCs get_public_selection et get_public_selection_by_slug
         * Structure définie dans migrations :
         * - 20251223_002_get_selection_by_slug.sql
         * - 20260109_008_add_branding_to_public_selection_rpc.sql
         */
        interface PublicSelectionResponse {
          success: boolean;
          error?: string;
          selection?: ISelection;
          items?: unknown[];
          branding?: {
            primary_color: string;
            secondary_color: string;
            accent_color: string;
            text_color: string;
            background_color: string;
            logo_url: string | null;
          };
          item_count?: number;
        }

        // Appel RPC selon le format
        // - UUID : get_public_selection(p_selection_id uuid)
        // - Slug : get_public_selection_by_slug(p_slug text)
        const { data, error: rpcError } = await supabase.rpc(
          isUuid ? 'get_public_selection' : 'get_public_selection_by_slug',
          isUuid ? { p_selection_id: id } : { p_slug: id }
        );

        if (rpcError) throw rpcError;

        // Cast explicite du type de retour (RPC retourne Json, on cast en PublicSelectionResponse)
        const typedData = data as unknown as PublicSelectionResponse;

        if (!typedData?.success) {
          throw new Error(typedData?.error ?? 'Selection non trouvee');
        }

        const selectionData = typedData.selection;

        if (!selectionData) {
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

        // Les RPCs get_public_selection et get_public_selection_by_slug
        // retournent déjà items et branding dans la réponse
        if (typedData.items) {
          setItems(typedData.items as unknown as ISelectionItem[]);
        }

        if (typedData.branding) {
          setBranding({
            primary_color:
              typedData.branding.primary_color ??
              DEFAULT_BRANDING.primary_color,
            secondary_color:
              typedData.branding.secondary_color ??
              DEFAULT_BRANDING.secondary_color,
            accent_color:
              typedData.branding.accent_color ?? DEFAULT_BRANDING.accent_color,
            text_color:
              typedData.branding.text_color ?? DEFAULT_BRANDING.text_color,
            background_color:
              typedData.branding.background_color ??
              DEFAULT_BRANDING.background_color,
            logo_url: typedData.branding.logo_url,
          });
        }

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

  const priceDisplayMode = selection?.price_display_mode ?? 'TTC';

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        (priceDisplayMode === 'HT'
          ? item.selling_price_ht
          : item.selling_price_ttc) *
          item.quantity,
      0
    );
  }, [cart, priceDisplayMode]);

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
              existing.subcategories = existing.subcategories ?? [];
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
    async (data: OrderFormUnifiedData, cartItems: UnifiedCartItem[]) => {
      if (!selection) return;

      const result = await submitOrder({
        affiliateId: selection.affiliate_id,
        selectionId: selection.id,
        cart: cartItems,
        data: data,
      });

      if (result.success && (result.orderNumber ?? result.orderId)) {
        // Store order summary for confirmation screen
        const restaurantName = data.isNewRestaurant
          ? data.newRestaurant.tradeName
          : (organisations.find(o => o.id === data.existingOrganisationId)
              ?.trade_name ?? 'Restaurant');
        const totalHT = cartItems.reduce(
          (sum, item) => sum + item.selling_price_ht * item.quantity,
          0
        );
        const totalTVA = totalHT * 0.2;
        const totalTTC = cartItems.reduce(
          (sum, item) => sum + item.selling_price_ttc * item.quantity,
          0
        );

        setSubmittedOrderData({
          requesterName: data.requester.name,
          requesterEmail: data.requester.email,
          restaurantName,
          isNewRestaurant: !!data.isNewRestaurant,
          deliveryAddress: data.delivery.address,
          deliveryAsap: data.delivery.deliveryAsap,
          items: cartItems.map(item => ({
            name: item.product_name,
            sku: item.product_sku,
            image: item.product_image ?? null,
            qty: item.quantity,
            priceTtc: item.selling_price_ttc * item.quantity,
          })),
          totalHT,
          totalTVA,
          totalTTC,
        });
        setOrderNumber(result.orderNumber ?? result.orderId ?? null);
      }

      if (!result.success) {
        throw new Error(
          result.error ?? 'Erreur lors de la creation de la commande'
        );
      }
    },
    [selection, submitOrder, organisations]
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
            {error ?? 'Selection non trouvee'}
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
            <span className="font-bold">
              {formatPrice(cartTotal)} {priceDisplayMode}
            </span>
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
                <div className="flex flex-col h-full overflow-y-auto">
                  {/* Header */}
                  <div className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-green-50 to-white text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Commande envoyee !
                    </h3>
                    <p className="text-gray-600">
                      Votre commande <strong>{orderNumber}</strong> a ete
                      enregistree.
                    </p>
                  </div>

                  {/* Body */}
                  <div className="px-8 py-6 space-y-4 flex-1">
                    {submittedOrderData && (
                      <>
                        {/* Résumé compact */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {submittedOrderData.items.length} produit
                              {submittedOrderData.items.length > 1 ? 's' : ''}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatPrice(submittedOrderData.totalTTC)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Livraison</span>
                            <span className="text-gray-500 italic">
                              a definir
                            </span>
                          </div>
                        </div>

                        {/* Transport notice */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <Truck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                              <span className="font-semibold">
                                Frais de transport non inclus.
                              </span>{' '}
                              Les frais seront calcules et communiques dans le
                              devis detaille.
                            </p>
                          </div>
                        </div>

                        {/* Prochaines etapes */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <p className="text-sm font-semibold text-green-900 mb-3">
                            Prochaines etapes
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-900">
                                  Commande recue
                                </p>
                                <p className="text-xs text-green-700">
                                  Votre commande a ete enregistree avec succes
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-900">
                                  Validation sous 24h
                                </p>
                                <p className="text-xs text-green-700">
                                  Notre equipe verifie et valide votre commande
                                  sous 24h ouvrees
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-900">
                                  Devis detaille par email
                                </p>
                                <p className="text-xs text-green-700">
                                  Vous recevrez un devis incluant les frais de
                                  transport a{' '}
                                  <span className="font-semibold">
                                    {submittedOrderData.requesterEmail}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Email info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <p className="text-xs text-blue-800">
                              Un email de confirmation sera envoye a{' '}
                              <span className="font-semibold">
                                {submittedOrderData.requesterEmail}
                              </span>
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-8 py-5 border-t bg-gray-50">
                    <button
                      onClick={() => {
                        setOrderNumber(null);
                        setSubmittedOrderData(null);
                        setIsOrderFormOpen(false);
                        setCart([]);
                      }}
                      className="w-full px-6 py-3 text-white rounded-lg hover:opacity-90 font-semibold"
                      style={{ backgroundColor: branding.primary_color }}
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <OrderFormUnified
                  affiliateId={selection.affiliate_id}
                  selectionId={selection.id}
                  selectionName={selection.name}
                  selectionSlug={id}
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
                  organisations={organisations}
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
