'use client';

/**
 * expense-form-sections.tsx
 *
 * Sections "informations de base" du formulaire de depense.
 * Les sections montants/TVA, description et actions sont dans expense-form-amounts.tsx
 */

import { PCG_SUGGESTED_CATEGORIES } from '@verone/finance';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Loader2 } from 'lucide-react';

import type { ExpenseFormData, Organisation } from './use-expense-form';

// =====================================================================
// SHARED PROP TYPES
// =====================================================================

interface WithFormData {
  formData: ExpenseFormData;
  setFormData: React.Dispatch<React.SetStateAction<ExpenseFormData>>;
  loading: boolean;
}

// =====================================================================
// SUB-COMPONENT: Numero + Categorie
// =====================================================================

function ExpenseDocumentFields({
  formData,
  setFormData,
  loading,
}: WithFormData) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="document_number">
          Numero depense <span className="text-red-500">*</span>
        </Label>
        <Input
          id="document_number"
          value={formData.document_number}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">
          Genere automatiquement selon format DEP-YYYY-MM-001
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">
          Categorie <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.pcg_code}
          onValueChange={value =>
            setFormData(prev => ({ ...prev, pcg_code: value }))
          }
          disabled={loading}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Selectionner une categorie" />
          </SelectTrigger>
          <SelectContent>
            {PCG_SUGGESTED_CATEGORIES.map(cat => (
              <SelectItem key={cat.code} value={cat.code}>
                {cat.code} - {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

// =====================================================================
// SUB-COMPONENT: Fournisseur + Date
// =====================================================================

interface ExpenseSupplierDateFieldsProps extends WithFormData {
  suppliers: Organisation[];
  loadingData: boolean;
}

function ExpenseSupplierDateFields({
  formData,
  setFormData,
  suppliers,
  loading,
  loadingData,
}: ExpenseSupplierDateFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="supplier">
          Fournisseur <span className="text-red-500">*</span>
        </Label>
        {loadingData ? (
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-500">Chargement...</span>
          </div>
        ) : (
          <Select
            value={formData.partner_id}
            onValueChange={value =>
              setFormData(prev => ({ ...prev, partner_id: value }))
            }
            disabled={loading}
          >
            <SelectTrigger id="supplier">
              <SelectValue placeholder="Selectionner un fournisseur" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.legal_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="document_date">
          Date depense <span className="text-red-500">*</span>
        </Label>
        <Input
          id="document_date"
          type="date"
          value={formData.document_date}
          onChange={e =>
            setFormData(prev => ({ ...prev, document_date: e.target.value }))
          }
          disabled={loading}
          required
        />
      </div>
    </>
  );
}

// =====================================================================
// SECTION: Informations de base (numero, categorie, fournisseur, date)
// =====================================================================

interface ExpenseInfoSectionProps extends WithFormData {
  suppliers: Organisation[];
  loadingData: boolean;
}

export function ExpenseInfoSection({
  formData,
  setFormData,
  suppliers,
  loading,
  loadingData,
}: ExpenseInfoSectionProps) {
  return (
    <>
      <ExpenseDocumentFields
        formData={formData}
        setFormData={setFormData}
        loading={loading}
      />
      <ExpenseSupplierDateFields
        formData={formData}
        setFormData={setFormData}
        suppliers={suppliers}
        loading={loading}
        loadingData={loadingData}
      />
    </>
  );
}

// =====================================================================
// Re-exports from expense-form-amounts.tsx for convenience
// =====================================================================

export {
  ExpenseAmountsSection,
  ExpenseDescriptionSection,
  ExpenseFormActions,
} from './expense-form-amounts';
