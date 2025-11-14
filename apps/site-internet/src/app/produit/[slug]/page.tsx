'use client';

import { useParams } from 'next/navigation';

import { ProductDetail } from '@/components/product/ProductDetail';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <ProductDetail slug={slug} />
    </div>
  );
}
