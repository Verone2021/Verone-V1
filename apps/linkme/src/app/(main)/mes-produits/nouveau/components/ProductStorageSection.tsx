'use client';

/**
 * ProductStorageSection - Section stockage & dimensions du formulaire produit
 *
 * @module ProductStorageSection
 * @since 2026-04-14
 */

import { Package, Ruler, Truck, Warehouse } from 'lucide-react';

interface FormData {
  store_at_verone: boolean;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  stock_units: string;
}

interface Errors {
  length_cm?: string;
  width_cm?: string;
  height_cm?: string;
  stock_units?: string;
}

interface ProductStorageSectionProps {
  formData: FormData;
  errors: Errors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStoreAtVeroneChange: (value: boolean) => void;
}

export function ProductStorageSection({
  formData,
  errors,
  onChange,
  onStoreAtVeroneChange,
}: ProductStorageSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Warehouse className="h-5 w-5 text-purple-600" />
        Stockage &amp; Expedition
      </h2>

      {/* Toggle stockage */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => onStoreAtVeroneChange(true)}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            formData.store_at_verone
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Warehouse
              className={`h-6 w-6 ${formData.store_at_verone ? 'text-purple-600' : 'text-gray-400'}`}
            />
            <span className="font-medium">Stocker chez Verone</span>
          </div>
          <p className="text-xs text-gray-500">
            Nous stockons et expedions vos produits pour vous
          </p>
        </button>

        <button
          type="button"
          onClick={() => onStoreAtVeroneChange(false)}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            !formData.store_at_verone
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Truck
              className={`h-6 w-6 ${!formData.store_at_verone ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <span className="font-medium">Gerer moi-meme</span>
          </div>
          <p className="text-xs text-gray-500">
            Je stocke et expedie mes produits moi-meme
          </p>
        </button>
      </div>

      {/* Dimensions */}
      <div
        className={
          formData.store_at_verone ? '' : 'opacity-50 pointer-events-none'
        }
      >
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Dimensions{' '}
            {formData.store_at_verone ? (
              <span className="text-red-500">*</span>
            ) : (
              '(optionnel)'
            )}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'length_cm', label: 'Longueur (cm)' },
            { key: 'width_cm', label: 'Largeur (cm)' },
            { key: 'height_cm', label: 'Hauteur (cm)' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {field.label}
              </label>
              <input
                type="number"
                name={field.key}
                value={formData[field.key as keyof FormData] as string}
                onChange={onChange}
                step="0.1"
                min="0"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors[field.key as keyof Errors]
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {errors[field.key as keyof Errors] && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[field.key as keyof Errors]}
                </p>
              )}
            </div>
          ))}
        </div>

        {formData.store_at_verone && (
          <p className="text-xs text-gray-500 mt-2">
            Necessaire pour calculer les frais de stockage
          </p>
        )}

        {/* Nombre d'unités */}
        {formData.store_at_verone && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">
                Nombre d&apos;unites a stocker{' '}
                <span className="text-red-500">*</span>
              </span>
            </div>
            <div className="max-w-xs">
              <input
                type="number"
                name="stock_units"
                value={formData.stock_units}
                onChange={onChange}
                min="1"
                step="1"
                placeholder="Ex: 10"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.stock_units ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.stock_units && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.stock_units}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Combien d&apos;unites allez-vous nous envoyer ?
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
