'use client';

import { Trash2, X, AlertTriangle } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import { cn } from '@verone/utils';

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  details?: string[];
  itemName?: string;
  itemCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export function ConfirmDeleteModal({
  title,
  message,
  details = [],
  itemName,
  itemCount,
  onConfirm,
  onCancel,
  loading = false,
  className,
}: ConfirmDeleteModalProps) {
  return (
    <div className={cn('bg-white rounded-lg max-w-md w-full p-6', className)}>
      {/* En-tête */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-red-100 text-red-600 rounded">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-medium text-black">{title}</h2>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </ButtonV2>
      </div>

      {/* Détails de l'élément à supprimer */}
      {itemName && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-black text-sm">{itemName}</div>
          {itemCount !== undefined && (
            <div className="text-xs text-gray-600 mt-1">
              {itemCount} variante(s) associée(s)
            </div>
          )}
        </div>
      )}

      {/* Avertissements */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-2">⚠️ Attention :</p>
            <ul className="space-y-1 text-xs">
              <li>• Cette action est irréversible</li>
              {details.map((detail, index) => (
                <li key={index}>• {detail}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        <ButtonV2 variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </ButtonV2>
        <ButtonV2
          variant="destructive"
          onClick={onConfirm}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 min-w-[120px]"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Suppression...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </>
          )}
        </ButtonV2>
      </div>
    </div>
  );
}
