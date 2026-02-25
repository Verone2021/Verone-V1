'use client';

/**
 * SendToStorageDialog - Dialog pour envoyer un produit au stock Verone
 *
 * @module SendToStorageDialog
 * @since 2026-02-25
 */

import { useState } from 'react';
import { Loader2, Warehouse } from 'lucide-react';
import { z } from 'zod';

import { useCreateStorageRequest } from '@/lib/hooks/use-storage-requests';

// Validation schema
const sendToStorageSchema = z.object({
  quantity: z.number().int().min(1, 'Minimum 1 unite'),
  notes: z.string().max(500, 'Maximum 500 caracteres').optional(),
});

interface SendToStorageDialogProps {
  product: {
    id: string;
    name: string;
    sku: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function SendToStorageDialog({
  product,
  isOpen,
  onClose,
}: SendToStorageDialogProps): JSX.Element | null {
  const [quantity, setQuantity] = useState<string>('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createRequest = useCreateStorageRequest();

  if (!isOpen) return null;

  const handleSubmit = async (): Promise<void> => {
    setError(null);

    const parsed = sendToStorageSchema.safeParse({
      quantity: parseInt(quantity, 10),
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Donnees invalides');
      return;
    }

    try {
      await createRequest.mutateAsync({
        product_id: product.id,
        quantity: parsed.data.quantity,
        notes: parsed.data.notes,
      });
      // Reset and close
      setQuantity('1');
      setNotes('');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    }
  };

  const handleClose = (): void => {
    if (createRequest.isPending) return;
    setQuantity('1');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        onKeyDown={e => {
          if (e.key === 'Escape') handleClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Fermer"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Warehouse className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#183559]">
              Envoyer au stock Verone
            </h2>
            <p className="text-sm text-gray-500">
              Demander l&apos;envoi de produits a l&apos;entrepot
            </p>
          </div>
        </div>

        {/* Product info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="font-medium text-[#183559]">{product.name}</p>
          <p className="text-sm text-gray-400 font-mono">{product.sku}</p>
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Quantite a envoyer *
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-[#5DBEBB] outline-none"
            disabled={createRequest.isPending}
          />
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes (optionnel)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Informations complementaires..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-[#5DBEBB] outline-none resize-none"
            disabled={createRequest.isPending}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {notes.length}/500
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={createRequest.isPending}
            className="flex-1 h-10 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubmit().catch(err => {
                console.error('[SendToStorageDialog] Submit failed:', err);
              });
            }}
            disabled={createRequest.isPending}
            className="flex-1 h-10 px-4 text-sm font-medium text-white bg-[#5DBEBB] hover:bg-[#5DBEBB]/90 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Warehouse className="h-4 w-4" />
                Envoyer la demande
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
