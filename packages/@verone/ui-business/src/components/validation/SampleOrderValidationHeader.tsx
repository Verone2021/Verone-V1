'use client';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import { ArrowRight } from 'lucide-react';

interface WorkflowMetrics {
  total_sourcing?: number;
  requiring_samples?: number;
  samples_validated?: number;
  approved_products?: number;
}

interface SampleOrderValidationHeaderProps {
  workflowMetrics: WorkflowMetrics | null;
}

export function SampleOrderValidationHeader({
  workflowMetrics,
}: SampleOrderValidationHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-black">
            Validation Échantillons Groupés
          </h2>
          <p className="text-gray-600">
            Gestion des commandes d&apos;échantillons par fournisseur
          </p>
        </div>
        <ButtonV2
          onClick={() => router.push('/produits/sourcing/validation')}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Validation Produits
        </ButtonV2>
      </div>

      {workflowMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-black">
              {workflowMetrics.total_sourcing ?? 0}
            </div>
            <div className="text-sm text-gray-600">Total sourcing</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-black">
              {workflowMetrics.requiring_samples ?? 0}
            </div>
            <div className="text-sm text-gray-600">
              Nécessitent échantillons
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {workflowMetrics.samples_validated ?? 0}
            </div>
            <div className="text-sm text-gray-600">Échantillons validés</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {workflowMetrics.approved_products ?? 0}
            </div>
            <div className="text-sm text-gray-600">Produits approuvés</div>
          </div>
        </div>
      )}
    </div>
  );
}
