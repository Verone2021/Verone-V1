'use client';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import { MessageSquarePlus } from 'lucide-react';

import { SourcingReportButton } from '@/components/business/sourcing-report/SourcingReportButton';

interface SourcingProductHeaderActionsProps {
  productId: string;
}

/**
 * Actions du header de la fiche produit sourcing.
 * Extraits dans un sous-composant pour respecter la limite max-lines (500)
 * sur page.tsx (cf. code-standards.md).
 */
export function SourcingProductHeaderActions({
  productId,
}: SourcingProductHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <ButtonV2
        variant="default"
        onClick={() =>
          router.push(`/consultations/create?productId=${productId}`)
        }
        className="bg-black hover:bg-gray-800 text-white"
      >
        <MessageSquarePlus className="h-4 w-4 mr-2" />
        Créer une consultation
      </ButtonV2>
      <SourcingReportButton />
    </div>
  );
}
