'use client';

import { Save, CheckCircle } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';

interface ProductDescriptionsFooterProps {
  description: string;
  technicalDescription: string;
  sellingPoints: string[];
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ProductDescriptionsFooter({
  description,
  technicalDescription,
  sellingPoints,
  saving,
  onCancel,
  onSave,
}: ProductDescriptionsFooterProps) {
  const totalChars = description.length + technicalDescription.length;
  const isComplete =
    description.trim() &&
    technicalDescription.trim() &&
    sellingPoints.length > 0;

  return (
    <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>{totalChars} caractères total</span>
          <span>
            {sellingPoints.length} point
            {sellingPoints.length > 1 ? 's' : ''} de vente
          </span>
          {isComplete && (
            <span className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Complet
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <ButtonV2 variant="outline" onClick={onCancel} disabled={saving}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={onSave}
            disabled={saving}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {saving ? (
              <>Sauvegarde...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
