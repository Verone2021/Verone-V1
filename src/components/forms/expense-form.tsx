/**
 * Formulaire: ExpenseForm
 * Route: /finance/depenses/create (inline dans page [id])
 * Description: Formulaire création dépense opérationnelle
 * Table Supabase: financial_documents (document_type = 'expense')
 * Bucket Storage: expense-receipts
 */

'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { format } from 'date-fns';
import { Loader2, Save, AlertCircle } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploadZone } from '@/components/ui/image-upload-zone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

interface Organisation {
  id: string;
  name: string;
  type: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  account_code: string | null;
}

interface ExpenseFormData {
  expense_category_id: string;
  partner_id: string;
  document_number: string;
  document_date: string;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  description: string;
  notes: string;
  uploaded_file_url?: string;
}

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// =====================================================================
// CONSTANTES
// =====================================================================

const TVA_RATES = [
  { value: 0, label: '0% (Exonéré)' },
  { value: 5.5, label: '5,5% (Taux réduit)' },
  { value: 10, label: '10% (Taux intermédiaire)' },
  { value: 20, label: '20% (Taux normal)' },
] as const;

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // États formulaire
  const [formData, setFormData] = useState<ExpenseFormData>({
    expense_category_id: '',
    partner_id: '',
    document_number: '',
    document_date: format(new Date(), 'yyyy-MM-dd'),
    total_ht: 0,
    tva_rate: 20, // Taux normal par défaut
    tva_amount: 0,
    total_ttc: 0,
    description: '',
    notes: '',
    uploaded_file_url: '',
  });

  // États UI
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);

  // Charger catégories et fournisseurs
  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);

        // Catégories dépenses
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('expense_categories')
          .select('id, name, account_code')
          .eq('is_active', true)
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories((categoriesData as any) || []);

        // Fournisseurs (organisations type supplier)
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('organisations')
          .select('id, name, type')
          .eq('type', 'supplier')
          .order('name');

        if (suppliersError) throw suppliersError;
        setSuppliers((suppliersData as any) || []);
      } catch (err) {
        console.error('Erreur chargement données:', err);
        setError('Impossible de charger les catégories et fournisseurs');
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

  // Auto-générer numéro dépense
  useEffect(() => {
    async function generateDocumentNumber() {
      try {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        // Compter dépenses du mois en cours
        const { count } = await supabase
          .from('financial_documents')
          .select('*', { count: 'exact', head: true })
          .eq('document_type', 'expense')
          .gte('created_at', `${year}-${month}-01`)
          .lt(
            'created_at',
            `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`
          );

        const nextNumber = String((count || 0) + 1).padStart(3, '0');
        const documentNumber = `DEP-${year}-${month}-${nextNumber}`;

        setFormData(prev => ({ ...prev, document_number: documentNumber }));
      } catch (err) {
        console.error('Erreur génération numéro:', err);
      }
    }

    generateDocumentNumber();
  }, []);

  // Calcul automatique TVA et TTC
  useEffect(() => {
    const tvaAmount = (formData.total_ht * formData.tva_rate) / 100;
    const totalTtc = formData.total_ht + tvaAmount;

    setFormData(prev => ({
      ...prev,
      tva_amount: parseFloat(tvaAmount.toFixed(2)),
      total_ttc: parseFloat(totalTtc.toFixed(2)),
    }));
  }, [formData.total_ht, formData.tva_rate]);

  // Validation formulaire
  const validateForm = (): boolean => {
    if (!formData.expense_category_id) {
      setError('Veuillez sélectionner une catégorie de dépense');
      return false;
    }

    if (!formData.partner_id) {
      setError('Veuillez sélectionner un fournisseur');
      return false;
    }

    if (!formData.document_number.trim()) {
      setError('Le numéro de document est requis');
      return false;
    }

    if (formData.total_ht <= 0) {
      setError('Le montant HT doit être supérieur à 0');
      return false;
    }

    if (!formData.description.trim()) {
      setError('La description est requise');
      return false;
    }

    if (!hasUploadedFile) {
      setError('Le justificatif (facture/reçu) est obligatoire');
      return false;
    }

    return true;
  };

  // Soumission formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Insérer financial_document
      const { error: insertError } = await supabase
        .from('financial_documents')
        .insert({
          document_type: 'expense',
          document_number: formData.document_number,
          partner_id: formData.partner_id,
          expense_category_id: formData.expense_category_id,
          document_date: formData.document_date,
          total_ht: formData.total_ht,
          tva_amount: formData.tva_amount,
          total_ttc: formData.total_ttc,
          amount_paid: 0,
          status: 'draft',
          description: formData.description,
          notes: formData.notes,
          uploaded_file_url: formData.uploaded_file_url,
        } as any);

      if (insertError) throw insertError;

      // Succès
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/finance/depenses');
        router.refresh();
      }
    } catch (err) {
      console.error('Erreur création dépense:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création de la dépense'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handler upload fichier
  const handleFileUpload = (url: string, fileName: string) => {
    setFormData({ ...formData, uploaded_file_url: url });
    setHasUploadedFile(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations Dépense</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Numéro document (auto) */}
          <div className="space-y-2">
            <Label htmlFor="document_number">
              Numéro dépense <span className="text-red-500">*</span>
            </Label>
            <Input
              id="document_number"
              value={formData.document_number}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Généré automatiquement selon format DEP-YYYY-MM-001
            </p>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Catégorie <span className="text-red-500">*</span>
            </Label>
            {loadingData ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Chargement...</span>
              </div>
            ) : (
              <Select
                value={formData.expense_category_id}
                onValueChange={value =>
                  setFormData({ ...formData, expense_category_id: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} {cat.account_code && `(${cat.account_code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Fournisseur */}
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
                  setFormData({ ...formData, partner_id: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date dépense */}
          <div className="space-y-2">
            <Label htmlFor="document_date">
              Date dépense <span className="text-red-500">*</span>
            </Label>
            <Input
              id="document_date"
              type="date"
              value={formData.document_date}
              onChange={e =>
                setFormData({ ...formData, document_date: e.target.value })
              }
              disabled={loading}
              required
            />
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total HT */}
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
                  setFormData({
                    ...formData,
                    total_ht: parseFloat(e.target.value) || 0,
                  })
                }
                disabled={loading}
                required
              />
            </div>

            {/* Taux TVA */}
            <div className="space-y-2">
              <Label htmlFor="tva_rate">
                Taux TVA <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tva_rate.toString()}
                onValueChange={value =>
                  setFormData({ ...formData, tva_rate: parseFloat(value) })
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

          {/* Montants calculés */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <p className="text-sm text-gray-500 mb-1">Montant TVA</p>
              <p className="text-lg font-bold">
                {formData.tva_amount.toFixed(2)} €
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total TTC</p>
              <p className="text-lg font-bold text-primary">
                {formData.total_ttc.toFixed(2)} €
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Décrivez la dépense..."
              rows={2}
              disabled={loading}
              required
            />
          </div>

          {/* Notes optionnelles */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notes complémentaires..."
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Upload justificatif OBLIGATOIRE */}
          <ImageUploadZone
            bucket="expense-receipts"
            folder={`expenses/${new Date().getFullYear()}/${String(
              new Date().getMonth() + 1
            ).padStart(2, '0')}`}
            onUploadSuccess={handleFileUpload}
            label="Justificatif (facture/reçu) *"
            helperText="Upload obligatoire : facture, reçu ou ticket de caisse"
            acceptedFormats={{
              'image/*': ['.png', '.jpg', '.jpeg'],
              'application/pdf': ['.pdf'],
            }}
          />
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-md bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ButtonV2 type="submit" disabled={loading || loadingData}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Créer la dépense
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
