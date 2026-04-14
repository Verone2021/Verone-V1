'use client';

/**
 * Sections "montants/TVA", "description", "actions" du formulaire de depense
 * Extraites de expense-form-sections.tsx pour respecter la limite de lignes
 */

import { ButtonV2 } from '@verone/ui';
import { ImageUploadZone } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Switch } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Loader2, Save, AlertCircle } from 'lucide-react';

import type { ExpenseFormData } from './use-expense-form';

// =====================================================================
// CONSTANTES
// =====================================================================

const TVA_RATES = [
  { value: 0, label: '0% (Exonere)' },
  { value: 5.5, label: '5,5% (Taux reduit)' },
  { value: 10, label: '10% (Taux intermediaire)' },
  { value: 20, label: '20% (Taux normal)' },
] as const;

// =====================================================================
// SHARED PROP TYPES
// =====================================================================

interface WithFormData {
  formData: ExpenseFormData;
  setFormData: React.Dispatch<React.SetStateAction<ExpenseFormData>>;
  loading: boolean;
}

// =====================================================================
// SUB-COMPONENT: Montant HT + Taux TVA (mode simple)
// =====================================================================

function ExpenseSimpleAmountFields({
  formData,
  setFormData,
  loading,
}: WithFormData) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="total_ht">
          Montant HT <span className="text-red-500">*</span>
        </Label>
        <Input
          id="total_ht"
          type="number"
          step="0.01"
          min="0.01"
          value={formData.total_ht}
          onChange={e =>
            setFormData(prev => ({
              ...prev,
              total_ht: parseFloat(e.target.value) || 0,
            }))
          }
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tva_rate">
          Taux TVA <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.tva_rate.toString()}
          onValueChange={value =>
            setFormData(prev => ({ ...prev, tva_rate: parseFloat(value) }))
          }
          disabled={loading}
        >
          <SelectTrigger id="tva_rate">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TVA_RATES.map(rate => (
              <SelectItem key={rate.value} value={rate.value.toString()}>
                {rate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// =====================================================================
// SUB-COMPONENT: Ventilation TVA multi-taux
// =====================================================================

function ExpenseVatBreakdown({ formData, setFormData, loading }: WithFormData) {
  return (
    <div className="space-y-4 p-4 border-2 border-dashed border-blue-200 rounded-md bg-blue-50">
      <p className="text-sm font-medium text-blue-800">
        Repartissez le montant HT par taux de TVA
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vatLine10Ht">Montant HT a 10%</Label>
          <Input
            id="vatLine10Ht"
            type="number"
            step="0.01"
            min="0"
            value={formData.vatLine10Ht ?? ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                vatLine10Ht: parseFloat(e.target.value) || 0,
              }))
            }
            disabled={loading}
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500">
            TVA: {((formData.vatLine10Ht * 10) / 100).toFixed(2)} EUR
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vatLine20Ht">Montant HT a 20%</Label>
          <Input
            id="vatLine20Ht"
            type="number"
            step="0.01"
            min="0"
            value={formData.vatLine20Ht ?? ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                vatLine20Ht: parseFloat(e.target.value) || 0,
              }))
            }
            disabled={loading}
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500">
            TVA: {((formData.vatLine20Ht * 20) / 100).toFixed(2)} EUR
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// SUB-COMPONENT: Totaux calcules (HT, TVA, TTC)
// =====================================================================

function ExpenseCalculatedTotals({ formData }: { formData: ExpenseFormData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {formData.isVentilated ? 'Total HT' : 'Montant HT'}
          </p>
          <p className="text-lg font-bold">
            {formData.total_ht.toFixed(2)} EUR
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Montant TVA</p>
          <p className="text-lg font-bold">
            {formData.tva_amount.toFixed(2)} EUR
          </p>
        </div>
      </div>
      <div className="p-4 bg-primary/10 rounded-md">
        <p className="text-sm text-gray-500 mb-1">Total TTC</p>
        <p className="text-2xl font-bold text-primary">
          {formData.total_ttc.toFixed(2)} EUR
        </p>
      </div>
    </>
  );
}

// =====================================================================
// SECTION: Montants et TVA
// =====================================================================

export function ExpenseAmountsSection({
  formData,
  setFormData,
  loading,
}: WithFormData) {
  return (
    <>
      {!formData.isVentilated && (
        <ExpenseSimpleAmountFields
          formData={formData}
          setFormData={setFormData}
          loading={loading}
        />
      )}

      <div className="flex items-center justify-between p-4 border rounded-md bg-slate-50">
        <div>
          <Label htmlFor="isVentilated" className="font-medium">
            Ventiler TVA (plusieurs taux)
          </Label>
          <p className="text-xs text-gray-500 mt-0.5">
            Ex: restaurant avec TVA 10% (repas) + 20% (alcool)
          </p>
        </div>
        <Switch
          id="isVentilated"
          checked={formData.isVentilated}
          onCheckedChange={checked =>
            setFormData(prev => ({ ...prev, isVentilated: checked }))
          }
          disabled={loading}
        />
      </div>

      {formData.isVentilated && (
        <ExpenseVatBreakdown
          formData={formData}
          setFormData={setFormData}
          loading={loading}
        />
      )}

      <ExpenseCalculatedTotals formData={formData} />
    </>
  );
}

// =====================================================================
// SECTION: Description, notes et upload
// =====================================================================

interface ExpenseDescriptionSectionProps extends WithFormData {
  onFileUpload: (url: string, fileName: string) => void;
}

export function ExpenseDescriptionSection({
  formData,
  setFormData,
  loading,
  onFileUpload,
}: ExpenseDescriptionSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          placeholder="Decrivez la depense..."
          rows={2}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={e =>
            setFormData(prev => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Notes complementaires..."
          rows={2}
          disabled={loading}
        />
      </div>

      <ImageUploadZone
        bucket="expense-receipts"
        folder={`expenses/${new Date().getFullYear()}/${String(
          new Date().getMonth() + 1
        ).padStart(2, '00')}`}
        onUploadSuccess={onFileUpload}
        label="Justificatif (facture/recu) *"
        helperText="Upload obligatoire : facture, recu ou ticket de caisse"
        acceptedFormats={{
          'image/*': ['.png', '.jpg', '.jpeg'],
          'application/pdf': ['.pdf'],
        }}
      />
    </>
  );
}

// =====================================================================
// SECTION: Actions (submit, cancel) + zone d'erreur
// =====================================================================

interface ExpenseFormActionsProps {
  loading: boolean;
  loadingData: boolean;
  error: string | null;
  onCancel?: () => void;
}

export function ExpenseFormActions({
  loading,
  loadingData,
  error,
  onCancel,
}: ExpenseFormActionsProps) {
  return (
    <>
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-md bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <ButtonV2 type="submit" disabled={loading || loadingData}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creation en cours...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Creer la depense
            </>
          )}
        </ButtonV2>

        {onCancel && (
          <ButtonV2 type="button" variant="outline" onClick={onCancel}>
            Annuler
          </ButtonV2>
        )}
      </div>
    </>
  );
}
