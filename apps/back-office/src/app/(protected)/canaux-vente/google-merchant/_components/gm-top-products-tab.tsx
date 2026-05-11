'use client';

import { useMemo } from 'react';

import { useGoogleMerchantProducts } from '@verone/channels';

import { ChannelTopProductsTable } from '../../meta/_components/channel-top-products-table';

export function GmTopProductsTab() {
  const { data: products, isLoading } = useGoogleMerchantProducts();

  const topProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => b.revenue_ht - a.revenue_ht)
      .slice(0, 20)
      .map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        sku: p.sku,
        primary_image_url: p.primary_image_url,
        impressions: p.impressions,
        clicks: p.clicks,
        conversions: p.conversions,
        revenue_ht: p.revenue_ht,
      }));
  }, [products]);

  return (
    <ChannelTopProductsTable
      products={topProducts}
      loading={isLoading}
      channelLabel="Google Merchant"
    />
  );
}
