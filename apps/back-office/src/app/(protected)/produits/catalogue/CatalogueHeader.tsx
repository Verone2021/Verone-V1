'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { ButtonUnified, Badge } from '@verone/ui';
import { Zap, Plus, Download, FileSpreadsheet, FileText } from 'lucide-react';

interface SLOResult {
  isCompliant: boolean;
  duration: number;
}

interface CatalogueHeaderProps {
  dashboardSLO: SLOResult;
}

export function CatalogueHeader({ dashboardSLO }: CatalogueHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setExporting(true);
    setShowExportMenu(false);
    toast({
      title: 'Export en cours...',
      description: `Generation du fichier ${format.toUpperCase()}`,
    });

    try {
      const response = await fetch('/api/exports/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? 'Erreur export');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verone-catalogue-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export termine',
        description: `Fichier ${format.toUpperCase()} telecharge`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Export echoue',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-light text-black">Catalogue Produits</h1>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {/* Export dropdown */}
          <div className="relative">
            <ButtonUnified
              onClick={() => setShowExportMenu(prev => !prev)}
              variant="outline"
              size="sm"
              icon={Download}
              iconPosition="left"
              className="h-8 text-xs"
              disabled={exporting}
            >
              {exporting ? 'Export...' : 'Exporter'}
            </ButtonUnified>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
                <button
                  onClick={() => {
                    void handleExport('xlsx');
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                  Export Excel (.xlsx)
                </button>
                <button
                  onClick={() => {
                    void handleExport('csv');
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Export CSV (.csv)
                </button>
              </div>
            )}
          </div>

          <ButtonUnified
            onClick={() => router.push('/produits/sourcing')}
            variant="outline"
            size="sm"
            icon={Zap}
            iconPosition="left"
            className="h-8 text-xs"
          >
            Sourcing Rapide
          </ButtonUnified>

          <ButtonUnified
            onClick={() => router.push('/produits/catalogue/nouveau')}
            variant="default"
            size="sm"
            icon={Plus}
            iconPosition="left"
            className="h-8 text-xs"
          >
            Nouveau Produit
          </ButtonUnified>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={dashboardSLO.isCompliant ? 'success' : 'destructive'}>
            {dashboardSLO.duration}ms
          </Badge>
          <span className="text-xs text-black opacity-50">SLO: &lt;2s</span>
        </div>
      </div>
    </div>
  );
}
