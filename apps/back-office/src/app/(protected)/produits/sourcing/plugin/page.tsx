'use client';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { ArrowLeft } from 'lucide-react';

import { SourcingPluginTab } from '../SourcingPluginTab';

export default function SourcingPluginPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div
        className="flex justify-between items-start"
        style={{ marginBottom: spacing[6] }}
      >
        <div>
          <ButtonV2
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => router.push('/produits/sourcing')}
            className="mb-2"
          >
            Retour au sourcing
          </ButtonV2>
          <h1
            className="text-3xl font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            Plugin navigateur
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Installation et guide d&apos;utilisation de l&apos;extension Chrome
            de sourcing Verone.
          </p>
        </div>
      </div>

      <SourcingPluginTab />
    </div>
  );
}
