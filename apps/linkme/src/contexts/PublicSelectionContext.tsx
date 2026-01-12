'use client';

/**
 * PublicSelectionContext
 *
 * Context pour partager les données de sélection publique entre les pages:
 * - Données de la sélection (nom, description, branding)
 * - Items du catalogue
 * - Panier (cart) avec fonctions d'ajout/mise à jour
 * - Organisations (pour enseignes)
 *
 * @module PublicSelectionContext
 * @since 2026-01-12
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface ISelectionItem {
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
  category: string | null;
  is_featured: boolean;
}

export interface ISelection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_id: string;
  published_at: string | null;
  created_at: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

export interface IOrganisation {
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

export interface IAffiliateInfo {
  role: string | null;
  enseigne_id: string | null;
  enseigne_name: string | null;
}

export interface ICartItem extends ISelectionItem {
  quantity: number;
}

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_BRANDING: IBranding = {
  primary_color: '#5DBEBB',
  secondary_color: '#3976BB',
  accent_color: '#7E84C0',
  text_color: '#183559',
  background_color: '#FFFFFF',
  logo_url: null,
};

// ============================================
// CONTEXT TYPE
// ============================================

interface PublicSelectionContextType {
  // Data
  selection: ISelection | null;
  items: ISelectionItem[];
  branding: IBranding;
  affiliateInfo: IAffiliateInfo | null;
  organisations: IOrganisation[];

  // Cart
  cart: ICartItem[];
  addToCart: (item: ISelectionItem) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;

  // State
  isLoading: boolean;
  error: string | null;
}

// ============================================
// CONTEXT
// ============================================

const PublicSelectionContext = createContext<PublicSelectionContextType | null>(
  null
);

// ============================================
// PROVIDER
// ============================================

interface PublicSelectionProviderProps {
  selectionId: string;
  children: React.ReactNode;
}

export function PublicSelectionProvider({
  selectionId,
  children,
}: PublicSelectionProviderProps) {
  // State
  const [selection, setSelection] = useState<ISelection | null>(null);
  const [items, setItems] = useState<ISelectionItem[]>([]);
  const [branding, setBranding] = useState<IBranding>(DEFAULT_BRANDING);
  const [affiliateInfo, setAffiliateInfo] = useState<IAffiliateInfo | null>(
    null
  );
  const [organisations, setOrganisations] = useState<IOrganisation[]>([]);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track view once
  const hasTrackedView = useRef(false);

  // Fetch selection data
  useEffect(() => {
    const fetchSelection = async (): Promise<void> => {
      try {
        const supabase = createClient();

        // Detect if id is UUID or slug
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            selectionId
          );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const { data, error: rpcError } = await (supabase.rpc as any)(
          isUuid ? 'get_public_selection' : 'get_public_selection_by_slug',
          isUuid ? { p_selection_id: selectionId } : { p_slug: selectionId }
        );

        if (rpcError) throw rpcError;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!data?.success) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          throw new Error((data?.error as string) ?? 'Selection non trouvee');
        }

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
  }, [selectionId]);

  // Track view
  useEffect(() => {
    if (selection?.id && !hasTrackedView.current) {
      hasTrackedView.current = true;
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      void (supabase.rpc as any)('track_selection_view', {
        p_selection_id: selection.id,
      });
    }
  }, [selection?.id]);

  // Cart functions
  const addToCart = useCallback((item: ISelectionItem): void => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number): void => {
    setCart(prev =>
      prev
        .map(c =>
          c.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter(c => c.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((itemId: string): void => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  }, []);

  const clearCart = useCallback((): void => {
    setCart([]);
  }, []);

  // Cart computed values
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.selling_price_ttc * item.quantity,
        0
      ),
    [cart]
  );

  // Context value
  const value = useMemo(
    () => ({
      selection,
      items,
      branding,
      affiliateInfo,
      organisations,
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal,
      isLoading,
      error,
    }),
    [
      selection,
      items,
      branding,
      affiliateInfo,
      organisations,
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal,
      isLoading,
      error,
    ]
  );

  return (
    <PublicSelectionContext.Provider value={value}>
      {children}
    </PublicSelectionContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function usePublicSelection(): PublicSelectionContextType {
  const ctx = useContext(PublicSelectionContext);
  if (!ctx) {
    throw new Error(
      'usePublicSelection must be used within PublicSelectionProvider'
    );
  }
  return ctx;
}
