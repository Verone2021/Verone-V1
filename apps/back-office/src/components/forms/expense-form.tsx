/**
 * Formulaire: ExpenseForm
 * Route: /finance/depenses/create (inline dans page [id])
 * Description: Formulaire création dépense opérationnelle
 * Table Supabase: financial_documents (document_type = 'expense')
 * Bucket Storage: expense-receipts
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

import {
  ExpenseAmountsSection,
  ExpenseDescriptionSection,
  ExpenseFormActions,
  ExpenseInfoSection,
} from './expense-form-sections';
import { useExpenseForm } from './use-expense-form';
import type { ExpenseFormProps } from './use-expense-form';

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const {
    formData,
    setFormData,
    suppliers,
    loading,
    loadingData,
    error,
    handleSubmit,
    handleFileUpload,
  } = useExpenseForm({ onSuccess, onCancel });

  return (
    <form
      onSubmit={e => {
        void handleSubmit(e).catch(err => {
          console.error('[ExpenseForm] handleSubmit failed:', err);
        });
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Informations Dépense</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExpenseInfoSection
            formData={formData}
            setFormData={setFormData}
            suppliers={suppliers}
            loading={loading}
            loadingData={loadingData}
          />
          <ExpenseAmountsSection
            formData={formData}
            setFormData={setFormData}
            loading={loading}
          />
          <ExpenseDescriptionSection
            formData={formData}
            setFormData={setFormData}
            loading={loading}
            onFileUpload={handleFileUpload}
          />
        </CardContent>
      </Card>

      <ExpenseFormActions
        loading={loading}
        loadingData={loadingData}
        error={error}
        onCancel={onCancel}
      />
    </form>
  );
}
