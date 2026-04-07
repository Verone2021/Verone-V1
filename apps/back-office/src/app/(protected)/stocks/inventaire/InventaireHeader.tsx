'use client';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import {
  Package,
  ArrowLeft,
  RefreshCw,
  Download,
  BarChart3,
} from 'lucide-react';

interface InventaireHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onOpenReports: () => void;
}

export function InventaireHeader({
  loading,
  onRefresh,
  onExport,
  onOpenReports,
}: InventaireHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="w-full px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => router.push('/stocks')}
              className="flex items-center text-gray-600 hover:text-black h-8 px-2"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Retour
            </ButtonV2>
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-black" />
              <div>
                <h1 className="text-xl font-bold text-black">
                  Inventaire Stock
                </h1>
                <p className="text-xs text-gray-600">
                  Vue consolidée des mouvements
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="border-black text-black hover:bg-black hover:text-white h-8 text-xs"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </ButtonV2>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={onExport}
              className="border-black text-black hover:bg-black hover:text-white h-8 text-xs"
            >
              <Download className="h-3 w-3 mr-1.5" />
              CSV
            </ButtonV2>
            <ButtonV2
              size="sm"
              className="bg-black hover:bg-gray-800 text-white h-8 text-xs"
              onClick={onOpenReports}
            >
              <BarChart3 className="h-3 w-3 mr-1.5" />
              Rapports
            </ButtonV2>
          </div>
        </div>
      </div>
    </div>
  );
}
