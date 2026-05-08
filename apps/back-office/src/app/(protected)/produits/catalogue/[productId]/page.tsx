'use client';

import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  return (
    <div style={{ padding: 32 }}>
      <h1>DEBUG MINIMAL — Product Detail</h1>
      <p>productId: {String(params.productId)}</p>
    </div>
  );
}
