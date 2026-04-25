import Script from 'next/script';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Typed window extension for fbq
type FbqFunction = (...args: unknown[]) => void;

interface WindowWithFbq extends Window {
  fbq?: FbqFunction;
  _fbq?: FbqFunction;
}

function getFbq(): FbqFunction | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as WindowWithFbq).fbq;
}

export function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// ============================================
// E-commerce event helpers
// ============================================
//
// IMPORTANT — content_ids = SKU côté Meta Catalog
//
// Le catalog Meta Verone utilise les SKUs (COU-0001, TAB-0004, …) comme
// retailer_id. Pour que Meta puisse matcher les events Pixel avec les
// produits du catalog (et donc afficher les produits pertinents dans
// les ads + dans le shop), content_ids doit contenir les SKUs, PAS les
// UUIDs Supabase. Les helpers acceptent `sku` en priorité, et fallback
// sur `id` (UUID) seulement si sku absent.
//
// Voir docs/current/integrations/meta-commerce/USAGE.md action 3.

function resolveContentId(
  sku: string | null | undefined,
  fallbackId: string
): string {
  return sku && sku.trim().length > 0 ? sku : fallbackId;
}

function resolveContentIds(
  items: Array<{ sku?: string | null; product_id: string }>
): string[] {
  return items.map(item => resolveContentId(item.sku, item.product_id));
}

export function trackMetaViewContent(product: {
  id: string;
  sku?: string | null;
  name: string;
  price: number;
  category?: string;
}) {
  if (!META_PIXEL_ID) return;
  const fbq = getFbq();
  fbq?.('track', 'ViewContent', {
    content_ids: [resolveContentId(product.sku, product.id)],
    content_name: product.name,
    content_type: 'product',
    content_category: product.category,
    value: product.price,
    currency: 'EUR',
  });
}

export function trackMetaAddToCart(product: {
  id: string;
  sku?: string | null;
  name: string;
  price: number;
  quantity: number;
}) {
  if (!META_PIXEL_ID) return;
  const fbq = getFbq();
  fbq?.('track', 'AddToCart', {
    content_ids: [resolveContentId(product.sku, product.id)],
    content_name: product.name,
    content_type: 'product',
    value: product.price * product.quantity,
    currency: 'EUR',
    num_items: product.quantity,
  });
}

export function trackMetaInitiateCheckout(params: {
  value: number;
  itemCount: number;
  items: Array<{ sku?: string | null; product_id: string }>;
}) {
  if (!META_PIXEL_ID) return;
  const fbq = getFbq();
  fbq?.('track', 'InitiateCheckout', {
    value: params.value,
    currency: 'EUR',
    num_items: params.itemCount,
    content_ids: resolveContentIds(params.items),
    content_type: 'product',
  });
}

export function trackMetaPurchase(params: {
  transactionId: string;
  value: number;
  items: Array<{ sku?: string | null; product_id: string }>;
  itemCount: number;
}) {
  if (!META_PIXEL_ID) return;
  const fbq = getFbq();
  fbq?.('track', 'Purchase', {
    value: params.value,
    currency: 'EUR',
    content_ids: resolveContentIds(params.items),
    content_type: 'product',
    num_items: params.itemCount,
    order_id: params.transactionId,
  });
}
