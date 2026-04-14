'use client';

import { useFixedAssets } from '@verone/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { KpiCard, KpiGrid } from '@verone/ui-business';
import { Building2, Monitor, Landmark } from 'lucide-react';

import { AssetRow, AddAssetDialog } from './ImmobilisationsComponents';

export default function ImmobilisationsPage() {
  const { assets, isLoading, error, stats, createAsset, deleteAsset } =
    useFixedAssets();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Immobilisations</h1>
          <p className="text-sm text-muted-foreground">
            Actifs amortissables — PCG classes 20-21
          </p>
        </div>
        <AddAssetDialog onSubmit={createAsset} />
      </div>

      <KpiGrid columns={4}>
        <KpiCard
          title="Valeur brute"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          }).format(stats.totalBrut)}
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiCard
          title="Amortissements cumules"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          }).format(stats.totalAmort)}
          icon={<Monitor className="h-4 w-4" />}
        />
        <KpiCard
          title="Valeur nette comptable"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          }).format(stats.totalNet)}
          icon={<Landmark className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          title="Actifs en cours"
          value={stats.activeCount}
          valueType="number"
        />
      </KpiGrid>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Chargement...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-red-700">{error}</CardContent>
        </Card>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Aucune immobilisation enregistree</p>
            <p className="text-xs mt-1">
              Ajoutez vos actifs amortissables (materiel, vehicules, logiciels,
              etc.)
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">
              {assets.length} immobilisation{assets.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="border-t">
              <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-xs font-medium text-muted-foreground bg-gray-50 border-b">
                <div className="col-span-1" />
                <div className="col-span-3">Designation</div>
                <div className="col-span-2">Date acquisition</div>
                <div className="col-span-2 text-right">Brut HT</div>
                <div className="col-span-2 text-right">VNC</div>
                <div className="col-span-1 text-right">Amorti</div>
                <div className="col-span-1" />
              </div>
              {assets.map(asset => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  onDelete={(id: string) => {
                    void deleteAsset(id);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
