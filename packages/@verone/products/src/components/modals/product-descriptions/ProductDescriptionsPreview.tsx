'use client';

import { FileText, Edit } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';

interface ProductDescriptionsPreviewProps {
  productName: string;
  description: string;
  technicalDescription: string;
  sellingPoints: string[];
  onEdit: () => void;
}

export function ProductDescriptionsPreview({
  productName,
  description,
  technicalDescription,
  sellingPoints,
  onEdit,
}: ProductDescriptionsPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Aperçu Final - {productName}
        </h3>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            Description
          </h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {description || 'Aucune description générale.'}
          </div>
        </div>

        {technicalDescription && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-800 mb-2">
              Spécifications techniques
            </h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {technicalDescription}
            </div>
          </div>
        )}

        {sellingPoints.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-800 mb-2">
              Points forts
            </h4>
            <ul className="space-y-1">
              {sellingPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!description &&
          !technicalDescription &&
          sellingPoints.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <div className="text-sm">Aucune description disponible</div>
              <div className="text-xs text-gray-400 mt-1">
                Commencez par remplir la description générale
              </div>
            </div>
          )}
      </div>

      <div className="flex justify-center">
        <ButtonV2 variant="outline" onClick={onEdit} className="text-sm">
          <Edit className="h-4 w-4 mr-2" />
          Retour à l'édition
        </ButtonV2>
      </div>
    </div>
  );
}
