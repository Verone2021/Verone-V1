'use client';

import { Loader2, Search } from 'lucide-react';

import { Card, CardContent, Input } from '@verone/ui';

import { useConfigurationPage } from './hooks';
import { ConfigurationHeader } from './components/ConfigurationHeader';
import { ConfigurationLegend } from './components/ConfigurationLegend';
import { KpiCards } from './components/KpiCards';
import { ProductsTable } from './components/ProductsTable';

export default function LinkMePricingConfigPage() {
  const {
    searchTerm,
    setSearchTerm,
    pendingChanges,
    filteredProducts,
    kpis,
    isLoading,
    updatePricingMutation,
    handleFieldChange,
    handleSaveAll,
    handleDiscardAll,
    getEffectiveValue,
    calculateMargin,
    hasChanges,
    getEffectiveTtcValue,
    handleTtcChange,
  } = useConfigurationPage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ConfigurationHeader
        pendingChangesCount={pendingChanges.size}
        isPending={updatePricingMutation.isPending}
        handleDiscardAll={handleDiscardAll}
        handleSaveAll={handleSaveAll}
      />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        <KpiCards kpis={kpis} />

        <Card>
          <CardContent className="pt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <ProductsTable
          filteredProducts={filteredProducts}
          pendingChanges={pendingChanges}
          getEffectiveValue={getEffectiveValue}
          getEffectiveTtcValue={getEffectiveTtcValue}
          calculateMargin={calculateMargin}
          hasChanges={hasChanges}
          handleFieldChange={handleFieldChange}
          handleTtcChange={handleTtcChange}
        />

        <ConfigurationLegend />
      </div>
    </div>
  );
}
