import { Eye, Loader2, Save, Send } from 'lucide-react';

interface ProduitPreviewSidebarProps {
  payout: number;
  viewOnly: boolean;
  canModify: boolean;
  isDraft: boolean;
  isRejected: boolean;
  isSubmitting: boolean;
  productId: string;
  onNavigateEdit: () => void;
  onSave: () => Promise<void>;
  onSubmitForApproval: () => Promise<void>;
}

export function ProduitPreviewSidebar({
  payout,
  viewOnly,
  canModify,
  isDraft,
  isRejected,
  isSubmitting,
  productId: _productId,
  onNavigateEdit,
  onSave,
  onSubmitForApproval,
}: ProduitPreviewSidebarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
      <h3 className="font-semibold text-gray-900 mb-4">Apercu prix</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Prix de vente HT</span>
          <span className="font-semibold text-green-600">
            {payout.toFixed(2)} EUR
          </span>
        </div>
        <div className="py-2 text-center">
          <p className="text-sm text-gray-500">
            Votre encaissement net sera calcule apres approbation (prix -
            commission LinkMe)
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {viewOnly && (
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <Eye className="h-5 w-5 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Mode consultation</p>
            {canModify && (
              <button
                onClick={onNavigateEdit}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Passer en mode édition
              </button>
            )}
          </div>
        )}

        {!viewOnly && (
          <>
            {isDraft && (
              <button
                onClick={() => {
                  void onSave().catch(error => {
                    console.error('[EditProduitPage] Save failed:', error);
                    alert('Erreur lors de la sauvegarde');
                  });
                }}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Sauvegarder
              </button>
            )}

            <button
              onClick={() => {
                void onSubmitForApproval().catch(error => {
                  console.error('[EditProduitPage] Submit failed:', error);
                  const msg =
                    error instanceof Error
                      ? error.message
                      : 'Erreur lors de la soumission';
                  alert(`Erreur: ${msg}`);
                });
              }}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {isRejected
                ? 'Resoumettre pour approbation'
                : 'Soumettre pour approbation'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
