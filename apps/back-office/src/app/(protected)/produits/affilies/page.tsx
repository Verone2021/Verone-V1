'use client';

import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';
import { ButtonV2 } from '@verone/ui';

import { ProduitsTab } from '../../canaux-vente/linkme/approbations/components/ProduitsTab';

export default function ProduitsAffiliesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/produits">
            <ButtonV2 variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Produits
            </ButtonV2>
          </Link>
        </div>
        <h1 className="text-3xl font-semibold text-black">Produits Affilies</h1>
        <p className="text-gray-600 mt-2">
          Validez les produits soumis par les affilies LinkMe
        </p>
      </div>

      <ProduitsTab />
    </div>
  );
}
