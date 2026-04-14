'use client';

/**
 * ProductPreviewSidebar - Sidebar résumé et actions pour création produit
 *
 * @module ProductPreviewSidebar
 * @since 2026-04-14
 */

import { Loader2, Save, Send } from 'lucide-react';

interface ProductPreviewSidebarProps {
  payout: number;
  storeAtVerone: boolean;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onSubmitForApproval: () => void;
}

export function ProductPreviewSidebar({
  payout,
  storeAtVerone,
  isSubmitting,
  onSaveDraft,
  onSubmitForApproval,
}: ProductPreviewSidebarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
      <h3 className="font-semibold text-gray-900 mb-4">Resume</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Votre payout</span>
          <span className="font-semibold text-green-600">
            {payout.toFixed(2)} EUR
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Stockage</span>
          <span
            className={`font-medium ${storeAtVerone ? 'text-purple-600' : 'text-blue-600'}`}
          >
            {storeAtVerone ? 'Chez Verone' : 'Gere par vous'}
          </span>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 text-center">
            Le prix client final sera calcule apres validation par notre equipe
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Sauvegarder brouillon
        </button>

        <button
          onClick={onSubmitForApproval}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          Soumettre pour approbation
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Votre produit sera verifie avant d&apos;etre visible
      </p>
    </div>
  );
}
