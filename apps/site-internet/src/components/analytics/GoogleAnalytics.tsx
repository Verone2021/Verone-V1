import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

// E-commerce event helpers
export function trackViewItem(product: {
  id: string;
  name: string;
  price: number;
  brand?: string;
  category?: string;
}) {
  if (typeof window === 'undefined' || !GA_ID) return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  w.gtag?.('event', 'view_item', {
    currency: 'EUR',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_brand: product.brand,
        item_category: product.category,
      },
    ],
  });
}

export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  if (typeof window === 'undefined' || !GA_ID) return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  w.gtag?.('event', 'add_to_cart', {
    currency: 'EUR',
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
      },
    ],
  });
}

export function trackBeginCheckout(value: number, itemCount: number) {
  if (typeof window === 'undefined' || !GA_ID) return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  w.gtag?.('event', 'begin_checkout', {
    currency: 'EUR',
    value,
    items: [{ quantity: itemCount }],
  });
}

export function trackPurchase(transaction: {
  transactionId: string;
  value: number;
  shipping: number;
  itemCount: number;
}) {
  if (typeof window === 'undefined' || !GA_ID) return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
  };
  w.gtag?.('event', 'purchase', {
    transaction_id: transaction.transactionId,
    currency: 'EUR',
    value: transaction.value,
    shipping: transaction.shipping,
    items: [{ quantity: transaction.itemCount }],
  });
}
