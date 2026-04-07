import type { FormData } from './mes-produits-id.types';

interface ProduitInfoFormProps {
  formData: FormData;
  errors: Record<string, string>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  viewOnly: boolean;
}

export function ProduitInfoForm({
  formData,
  errors,
  handleChange,
  viewOnly,
}: ProduitInfoFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom du produit {!viewOnly && '*'}
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={viewOnly}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={viewOnly}
          rows={4}
          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}
