'use client';

import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { PCG_SUGGESTED_CATEGORIES } from '@verone/finance';
import { createClient } from '@verone/utils/supabase/client';
import { format } from 'date-fns';

// =====================================================================
// TYPES (exported for use in sections)
// =====================================================================

export interface Organisation {
  id: string;
  legal_name: string;
  type: string | null;
}

export interface ExpenseFormData {
  pcg_code: string;
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
  isVentilated: boolean;
  vatLine10Ht: number;
  vatLine20Ht: number;
}

export interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Table financial_document_lines dropped in migration 20260321190000
// Type kept inline for expense form compatibility until table is recreated
interface VatLineInsert {
  document_id: string;
  line_number: number;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number | null;
  total_ttc: number | null;
  pcg_code?: string | null;
  sort_order?: number | null;
}

type SetFormData = React.Dispatch<React.SetStateAction<ExpenseFormData>>;

// =====================================================================
// INITIAL STATE
// =====================================================================

const INITIAL_FORM_DATA: ExpenseFormData = {
  pcg_code: '',
  partner_id: '',
  document_number: '',
  document_date: format(new Date(), 'yyyy-MM-dd'),
  total_ht: 0,
  tva_rate: 20,
  tva_amount: 0,
  total_ttc: 0,
  description: '',
  notes: '',
  uploaded_file_url: '',
  isVentilated: false,
  vatLine10Ht: 0,
  vatLine20Ht: 0,
};

// =====================================================================
// HELPER: Build VAT line items for DB insert
// =====================================================================

function buildSimpleVatItem(
  documentId: string,
  formData: ExpenseFormData
): VatLineInsert {
  return {
    document_id: documentId,
    description: formData.description,
    line_number: 1,
    quantity: 1,
    unit_price_ht: formData.total_ht,
    total_ht: formData.total_ht,
    tva_rate: formData.tva_rate,
    tva_amount: formData.tva_amount,
    total_ttc: formData.total_ttc,
    sort_order: 0,
  };
}

function buildVentilatedVatItems(
  documentId: string,
  formData: ExpenseFormData
): VatLineInsert[] {
  const items: VatLineInsert[] = [];
  if (formData.vatLine10Ht > 0) {
    items.push({
      document_id: documentId,
      description: 'Ligne TVA 10%',
      line_number: 1,
      quantity: 1,
      unit_price_ht: formData.vatLine10Ht,
      total_ht: formData.vatLine10Ht,
      tva_rate: 10,
      tva_amount: parseFloat(((formData.vatLine10Ht * 10) / 100).toFixed(2)),
      total_ttc: parseFloat((formData.vatLine10Ht * 1.1).toFixed(2)),
      sort_order: 0,
    });
  }
  if (formData.vatLine20Ht > 0) {
    items.push({
      document_id: documentId,
      description: 'Ligne TVA 20%',
      line_number: 2,
      quantity: 1,
      unit_price_ht: formData.vatLine20Ht,
      total_ht: formData.vatLine20Ht,
      tva_rate: 20,
      tva_amount: parseFloat(((formData.vatLine20Ht * 20) / 100).toFixed(2)),
      total_ttc: parseFloat((formData.vatLine20Ht * 1.2).toFixed(2)),
      sort_order: 1,
    });
  }
  return items;
}

function buildVatItems(
  documentId: string,
  formData: ExpenseFormData
): VatLineInsert[] {
  if (!formData.isVentilated) {
    return [buildSimpleVatItem(documentId, formData)];
  }
  return buildVentilatedVatItems(documentId, formData);
}

// =====================================================================
// HELPER: Validate form data
// =====================================================================

function validateExpenseForm(
  formData: ExpenseFormData,
  hasUploadedFile: boolean,
  setError: (msg: string) => void
): boolean {
  if (!formData.pcg_code) {
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
  if (formData.isVentilated) {
    if (formData.vatLine10Ht <= 0 && formData.vatLine20Ht <= 0) {
      setError(
        'En mode ventilé, au moins un montant HT doit être supérieur à 0'
      );
      return false;
    }
  } else if (formData.total_ht <= 0) {
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
}

// =====================================================================
// SUB-HOOK: Suppliers loading + document number generation
// =====================================================================

function useExpenseFormData(setFormData: SetFormData) {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Organisation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('organisations')
        .select('id, legal_name, type')
        .eq('type', 'supplier')
        .order('legal_name');
      if (error) throw error;
      setSuppliers(data ?? []);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setFetchError('Impossible de charger les fournisseurs');
    } finally {
      setLoadingData(false);
    }
  }, [supabase]);

  const generateDocumentNumber = useCallback(async () => {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const { count } = await supabase
        .from('financial_documents')
        .select('*', { count: 'exact', head: true })
        .eq('document_type', 'expense')
        .gte('created_at', `${year}-${month}-01`)
        .lt(
          'created_at',
          `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`
        );
      const nextNumber = String((count ?? 0) + 1).padStart(3, '0');
      setFormData(prev => ({
        ...prev,
        document_number: `DEP-${year}-${month}-${nextNumber}`,
      }));
    } catch (err) {
      console.error('Erreur génération numéro:', err);
    }
  }, [supabase, setFormData]);

  useEffect(() => {
    void fetchSuppliers().catch(err => {
      console.error('[useExpenseFormData] fetchSuppliers failed:', err);
    });
  }, [fetchSuppliers]);

  useEffect(() => {
    void generateDocumentNumber().catch(err => {
      console.error('[useExpenseFormData] generateDocumentNumber failed:', err);
    });
  }, [generateDocumentNumber]);

  return { suppliers, loadingData, fetchError };
}

// =====================================================================
// SUB-HOOK: TVA auto-calculation
// =====================================================================

function useVatCalculation(
  formData: ExpenseFormData,
  setFormData: SetFormData
) {
  useEffect(() => {
    if (formData.isVentilated) {
      const vat10 = (formData.vatLine10Ht * 10) / 100;
      const vat20 = (formData.vatLine20Ht * 20) / 100;
      const totalHt = formData.vatLine10Ht + formData.vatLine20Ht;
      const tvaAmount = vat10 + vat20;
      setFormData(prev => ({
        ...prev,
        total_ht: parseFloat(totalHt.toFixed(2)),
        tva_amount: parseFloat(tvaAmount.toFixed(2)),
        total_ttc: parseFloat((totalHt + tvaAmount).toFixed(2)),
      }));
    } else {
      const tvaAmount = (formData.total_ht * formData.tva_rate) / 100;
      setFormData(prev => ({
        ...prev,
        tva_amount: parseFloat(tvaAmount.toFixed(2)),
        total_ttc: parseFloat((formData.total_ht + tvaAmount).toFixed(2)),
      }));
    }
  }, [
    formData.total_ht,
    formData.tva_rate,
    formData.isVentilated,
    formData.vatLine10Ht,
    formData.vatLine20Ht,
    setFormData,
  ]);
}

// =====================================================================
// HELPER: Insert expense document into DB
// =====================================================================

interface InsertExpenseParams {
  formData: ExpenseFormData;
  userId: string;
}

async function insertExpenseDocument(
  supabase: ReturnType<typeof createClient>,
  { formData, userId }: InsertExpenseParams
) {
  const selectedCategory = PCG_SUGGESTED_CATEGORIES.find(
    cat => cat.code === formData.pcg_code
  );
  const categoryLabel = selectedCategory
    ? `${selectedCategory.code} - ${selectedCategory.label}`
    : formData.pcg_code;

  return supabase
    .from('financial_documents')
    .insert({
      document_type: 'expense',
      document_direction: 'outbound',
      document_number: formData.document_number,
      partner_id: formData.partner_id,
      partner_type: 'supplier',
      document_date: formData.document_date,
      total_ht: formData.total_ht,
      tva_amount: formData.tva_amount,
      total_ttc: formData.total_ttc,
      amount_paid: 0,
      status: 'draft',
      description: `[${categoryLabel}] ${formData.description}`,
      notes: formData.notes,
      uploaded_file_url: formData.uploaded_file_url,
      created_by: userId,
    })
    .select('id')
    .single();
}

// =====================================================================
// SUB-HOOK: Form submission
// =====================================================================

interface UseExpenseSubmitParams {
  formData: ExpenseFormData;
  hasUploadedFile: boolean;
  onSuccess?: () => void;
}

function useExpenseSubmit({
  formData,
  hasUploadedFile,
  onSuccess,
}: UseExpenseSubmitParams) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Table financial_document_lines dropped — lines stored as JSON in document metadata
  const insertDocumentLines = async (_documentId: string) => {
    const items = buildVatItems(_documentId, formData);
    if (items.length > 0) {
      console.warn(
        '[use-expense-form] financial_document_lines table dropped — skipping line insertion',
        items.length,
        'items'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateExpenseForm(formData, hasUploadedFile, setSubmitError)) return;
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError ?? !user) throw new Error('Utilisateur non connecté');
      const { data: insertedDoc, error: insertError } =
        await insertExpenseDocument(supabase, {
          formData,
          userId: user?.id ?? '',
        });
      if (insertError) throw insertError;
      if (insertedDoc?.id) {
        await insertDocumentLines(insertedDoc.id);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/finance/depenses');
        router.refresh();
      }
    } catch (err) {
      console.error('Erreur création dépense:', err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création de la dépense'
      );
    } finally {
      setLoading(false);
    }
  };

  return { loading, submitError, handleSubmit };
}

// =====================================================================
// MAIN HOOK
// =====================================================================

export function useExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>(INITIAL_FORM_DATA);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);

  const { suppliers, loadingData, fetchError } =
    useExpenseFormData(setFormData);
  useVatCalculation(formData, setFormData);

  const { loading, submitError, handleSubmit } = useExpenseSubmit({
    formData,
    hasUploadedFile,
    onSuccess,
  });

  const error = submitError ?? fetchError;

  const handleFileUpload = (url: string, _fileName: string) => {
    setFormData(prev => ({ ...prev, uploaded_file_url: url }));
    setHasUploadedFile(true);
  };

  return {
    formData,
    setFormData,
    suppliers,
    loading,
    loadingData,
    error,
    onCancel,
    handleSubmit,
    handleFileUpload,
  };
}
