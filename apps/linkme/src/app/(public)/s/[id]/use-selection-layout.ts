'use client';

/**
 * use-selection-layout - Hook logique métier du layout de sélection publique
 *
 * Gère : fetch, cart, catégories, soumission commande, tabs de navigation
 *
 * @module use-selection-layout
 * @since 2026-04-14
 */

import { use, useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname } from 'next/navigation';

import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';

import type {
  CartItem as UnifiedCartItem,
  OrderFormUnifiedData,
} from '@/components/OrderFormUnified';
import { useEnseigneOrganisations } from '@/lib/hooks/use-enseigne-organisations';
import { useSubmitUnifiedOrder } from '@/lib/hooks/use-submit-unified-order';

import {
  DEFAULT_BRANDING,
  type IAffiliateInfo,
  type IBranding,
  type ICartItem,
  type ICategory,
  type ISelection,
  type ISelectionItem,
} from './selection-context';

const supabase: SupabaseClient<Database> = createClient();

// ============================================================================
// TYPES
// ============================================================================

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
}

interface AffiliateWithEnseigne {
  display_name: string;
  enseigne_id: string | null;
  enseignes: { name: string } | null;
}

export interface SubmittedOrderData {
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
}

// ============================================================================
// HOOK
// ============================================================================

export function useSelectionLayout(params: Promise<{ id: string }>) {
  const { id } = use(params);
  const pathname = usePathname();

  const [selection, setSelection] = useState<ISelection | null>(null);
  const [items, setItems] = useState<ISelectionItem[]>([]);
  const [branding, setBranding] = useState<IBranding>(DEFAULT_BRANDING);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submittedOrderData, setSubmittedOrderData] =
    useState<SubmittedOrderData | null>(null);
  const [affiliateInfo, setAffiliateInfo] = useState<IAffiliateInfo | null>(
    null
  );

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
         * Détection UUID vs slug pour routing des sélections publiques.
         * @see docs/critical/linkme-public-selection-routing.md
         */
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id
          );

        const { data, error: rpcError } = await supabase.rpc(
          isUuid ? 'get_public_selection' : 'get_public_selection_by_slug',
          isUuid ? { p_selection_id: id } : { p_slug: id }
        );

        if (rpcError) throw rpcError;

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
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is ICartItem => item !== null)
    );
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const priceDisplayMode = selection?.price_display_mode ?? 'TTC';

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (priceDisplayMode === 'HT'
            ? item.selling_price_ht
            : item.selling_price_ttc) *
            item.quantity,
        0
      ),
    [cart, priceDisplayMode]
  );

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
        data,
      });

      if (result.success && (result.orderNumber ?? result.orderId)) {
        const restaurantName = data.isNewRestaurant
          ? data.newRestaurant.tradeName
          : (organisations.find(o => o.id === data.existingOrganisationId)
              ?.trade_name ?? 'Restaurant');
        const totalHT = cartItems.reduce(
          (sum, item) => sum + item.selling_price_ht * item.quantity,
          0
        );
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
          totalTVA: totalHT * 0.2,
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

  const tabs = useMemo(() => {
    const baseTabs = [
      { label: 'Catalogue', href: `/s/${id}/catalogue` },
      { label: 'FAQ', href: `/s/${id}/faq` },
      { label: 'Contact', href: `/s/${id}/contact` },
    ];
    if (affiliateInfo?.role === 'enseigne' && organisations.length > 0) {
      baseTabs.splice(1, 0, {
        label: 'Points de vente',
        href: `/s/${id}/points-de-vente`,
      });
    }
    return baseTabs;
  }, [id, affiliateInfo, organisations]);

  return {
    id,
    pathname,
    selection,
    items,
    branding,
    cart,
    setCart,
    isLoading,
    error,
    isOrderFormOpen,
    setIsOrderFormOpen,
    orderNumber,
    setOrderNumber,
    submittedOrderData,
    setSubmittedOrderData,
    affiliateInfo,
    organisations,
    isSubmitting,
    cartCount,
    priceDisplayMode,
    cartTotal,
    categories,
    tabs,
    addToCart,
    updateQuantity,
    removeFromCart,
    handleOrderSubmit,
  };
}
