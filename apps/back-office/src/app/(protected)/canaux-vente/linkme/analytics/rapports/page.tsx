'use client';

import { Card, CardContent } from '@verone/ui';
import { FileText, AlertCircle } from 'lucide-react';

export default function RapportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="text-sm text-gray-500">
          Génération et export de rapports d&apos;analyse
        </p>
      </div>

      {/* Info Banner */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              Aucun rapport disponible
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Cette fonctionnalité sera disponible dans une prochaine version.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Fonctionnalité en développement</p>
          <p className="text-amber-700 mt-1">
            La génération automatique de rapports PDF/Excel sera disponible dans
            une prochaine version. Pour l&apos;instant, utilisez l&apos;export
            CSV depuis la page Analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
