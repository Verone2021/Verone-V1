'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirect to catalogue with archived tab — this page was mocked with empty data.
// The real archived products are accessible via the "Produits Archivés" tab in the catalogue.
export default function ArchivedProductsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/produits/catalogue?tab=archived');
  }, [router]);

  return null;
}
