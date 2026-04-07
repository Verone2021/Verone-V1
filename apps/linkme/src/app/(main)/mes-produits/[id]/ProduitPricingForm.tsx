import type { FormData } from './mes-produits-id.types';

interface ProduitPricingFormProps {
  formData: FormData;
  errors: Record<string, string>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  viewOnly: boolean;
  isApproved: boolean;
  affiliateCommissionRate?: number | null;
}

export function ProduitPricingForm({
  formData,
  errors,
  handleChange,
  viewOnly,
  isApproved,
  affiliateCommissionRate,
}: ProduitPricingFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Votre prix de vente HT {!viewOnly && '*'}
        </label>
        <div className="relative">
          <input
            type="number"
            name="affiliate_payout_ht"
            value={formData.affiliate_payout_ht}
            onChange={handleChange}
            disabled={viewOnly}
            step="0.01"
            min="0"
            className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.affiliate_payout_ht ? 'border-red-500' : 'border-gray-300'
            } ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            EUR
          </span>
        </div>
        {errors.affiliate_payout_ht && (
          <p className="text-red-500 text-sm mt-1">
            {errors.affiliate_payout_ht}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Prix de vente hors taxes. Encaissement net = prix - commission LinkMe
        </p>
      </div>

      {isApproved && affiliateCommissionRate && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            Commission plateforme : <strong>{affiliateCommissionRate}%</strong>
          </p>
        </div>
      )}

      {!isApproved && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            La commission plateforme sera définie par Vérone lors de
            l&apos;approbation du produit.
          </p>
        </div>
      )}
    </div>
  );
}
