/**
 * Formulaire: StockAdjustmentForm
 * Route: /stocks/ajustements/create (inline dans page)
 * Description: Formulaire ajustement inventaire (augmentation/diminution/correction)
 * Table Supabase: stock_movements (movement_type = 'ADJUST')
 * Bucket Storage: stock-adjustments
 */

'use client';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Loader2, Save, AlertCircle } from 'lucide-react';

import { AdjustmentFormFields } from './stock-adjustment-form-fields';
import {
  useStockAdjustmentForm,
  type StockAdjustmentFormProps,
} from './use-stock-adjustment-form';

export function StockAdjustmentForm({
  onSuccess,
  onCancel,
}: StockAdjustmentFormProps) {
  const {
    formData,
    setFormData,
    products,
    selectedProduct,
    loading,
    loadingProducts,
    error,
    handleProductChange,
    calculateQuantityChange,
    handleSubmit,
    handleFileUpload,
  } = useStockAdjustmentForm({ onSuccess });

  return (
    <form
      onSubmit={e => {
        void handleSubmit(e).catch(err => {
          console.error('[StockAdjustmentForm] handleSubmit failed:', err);
        });
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Informations Ajustement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdjustmentFormFields
            formData={formData}
            setFormData={setFormData}
            products={products}
            selectedProduct={selectedProduct}
            loading={loading}
            loadingProducts={loadingProducts}
            onProductChange={handleProductChange}
            calculateQuantityChange={calculateQuantityChange}
            onFileUpload={handleFileUpload}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-md bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <ButtonV2 type="submit" disabled={loading || loadingProducts}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Créer l&apos;ajustement
            </>
          )}
        </ButtonV2>

        {onCancel && (
          <ButtonV2 type="button" variant="outline" onClick={onCancel}>
            Annuler
          </ButtonV2>
        )}
      </div>
    </form>
  );
}
