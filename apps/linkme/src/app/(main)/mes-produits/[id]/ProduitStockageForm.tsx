import { Warehouse, Truck } from 'lucide-react';

import type { FormData } from './mes-produits-id.types';

interface ProduitStockageFormProps {
  formData: FormData;
  errors: Record<string, string>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  setStoreAtVerone: (value: boolean) => void;
  viewOnly: boolean;
}

export function ProduitStockageForm({
  formData,
  errors,
  handleChange,
  setStoreAtVerone,
  viewOnly,
}: ProduitStockageFormProps) {
  return (
    <>
      {/* Toggle stockage */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Comment souhaitez-vous gérer le stockage ?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => !viewOnly && setStoreAtVerone(true)}
            disabled={viewOnly}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.store_at_verone
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${viewOnly ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            <Warehouse
              className={`h-6 w-6 mx-auto mb-2 ${formData.store_at_verone ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <p
              className={`font-medium ${formData.store_at_verone ? 'text-blue-700' : 'text-gray-700'}`}
            >
              Stocker chez Vérone
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Nous gérons le stock et les envois
            </p>
          </button>
          <button
            type="button"
            onClick={() => !viewOnly && setStoreAtVerone(false)}
            disabled={viewOnly}
            className={`p-4 rounded-lg border-2 transition-all ${
              !formData.store_at_verone
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${viewOnly ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            <Truck
              className={`h-6 w-6 mx-auto mb-2 ${!formData.store_at_verone ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <p
              className={`font-medium ${!formData.store_at_verone ? 'text-blue-700' : 'text-gray-700'}`}
            >
              Gérer moi-même
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Vous envoyez directement au client
            </p>
          </button>
        </div>
      </div>

      {/* Dimensions - obligatoires si stockage Verone */}
      {formData.store_at_verone && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dimensions du produit{' '}
            {!viewOnly && '(obligatoires pour le stockage) *'}
          </label>
          <div className="grid grid-cols-3 gap-4">
            {(['length_cm', 'width_cm', 'height_cm'] as const).map(field => {
              const labels = {
                length_cm: 'Longueur (cm)',
                width_cm: 'Largeur (cm)',
                height_cm: 'Hauteur (cm)',
              };
              return (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {labels[field]}
                  </label>
                  <input
                    type="number"
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    disabled={viewOnly}
                    step="0.1"
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors[field] ? 'border-red-500' : 'border-gray-300'
                    } ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                  {errors[field] && (
                    <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
