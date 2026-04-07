'use client';

import { useState } from 'react';

import Link from 'next/link';

import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Plus } from 'lucide-react';

import { useSelectionsData, useSelectionsForm } from './hooks';
import { CreateSelectionModal } from './components/CreateSelectionModal';
import { SelectionsFilters } from './components/SelectionsFilters';
import { SelectionsTabs } from './components/SelectionsTabs';
import { SelectionsTable } from './components/SelectionsTable';

export function SelectionsSection() {
  const {
    selections,
    affiliates,
    catalogProducts,
    loading,
    fetchData,
    handleDeleteSelection,
    handleArchive,
  } = useSelectionsData();

  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    saving,
    formData,
    setFormData,
    selectedProducts,
    productSearch,
    setProductSearch,
    filteredCatalogProducts,
    marginValidationErrors,
    hasValidationErrors,
    resetForm,
    addProductToSelection,
    removeProductFromSelection,
    updateProductMargin,
    handleCreateSelection,
  } = useSelectionsForm(catalogProducts, fetchData);

  const [searchTerm, setSearchTerm] = useState('');
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const activeCount = selections.filter(s => s.archived_at === null).length;
  const archivedCount = selections.filter(s => s.archived_at !== null).length;

  const filteredSelections = selections.filter(selection => {
    const matchesSearch =
      selection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selection.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAffiliate =
      affiliateFilter === 'all' || selection.affiliate_id === affiliateFilter;
    const matchesTab =
      activeTab === 'active'
        ? selection.archived_at === null
        : selection.archived_at !== null;
    return matchesSearch && matchesAffiliate && matchesTab;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sélections</CardTitle>
              <CardDescription>
                Toutes les mini-boutiques créées par les affiliés
              </CardDescription>
            </div>
            <Link href="/canaux-vente/linkme/selections/new">
              <ButtonV2>
                <Plus className="h-4 w-4 mr-2" />
                Créer une sélection
              </ButtonV2>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <SelectionsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeCount={activeCount}
            archivedCount={archivedCount}
          />

          <SelectionsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            affiliateFilter={affiliateFilter}
            onAffiliateFilterChange={setAffiliateFilter}
            affiliates={affiliates}
          />

          <SelectionsTable
            selections={filteredSelections}
            searchTerm={searchTerm}
            affiliateFilter={affiliateFilter}
            activeTab={activeTab}
            onArchive={handleArchive}
            onDelete={handleDeleteSelection}
          />
        </CardContent>
      </Card>

      <CreateSelectionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        affiliates={affiliates}
        formData={formData}
        onFormDataChange={partial =>
          setFormData(prev => ({ ...prev, ...partial }))
        }
        selectedProducts={selectedProducts}
        filteredCatalogProducts={filteredCatalogProducts}
        productSearch={productSearch}
        onProductSearchChange={setProductSearch}
        marginValidationErrors={marginValidationErrors}
        hasValidationErrors={hasValidationErrors}
        saving={saving}
        onAddProduct={addProductToSelection}
        onRemoveProduct={removeProductFromSelection}
        onUpdateMargin={updateProductMargin}
        onSubmit={handleCreateSelection}
        onCancel={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
      />
    </>
  );
}
