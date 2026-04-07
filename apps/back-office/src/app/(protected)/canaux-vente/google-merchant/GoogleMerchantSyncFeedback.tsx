'use client';

import { Alert, AlertDescription, AlertTitle } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Progress } from '@verone/ui';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

type GoogleMerchantSyncFeedbackProps = {
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  synced: number;
  failed: number;
  skipped: number;
  total: number;
  progress: number;
  duration: number;
  error: string | null | undefined;
};

export function GoogleMerchantSyncFeedback({
  syncStatus,
  synced,
  failed,
  skipped,
  total,
  progress,
  duration,
  error,
}: GoogleMerchantSyncFeedbackProps): JSX.Element | null {
  if (syncStatus === 'syncing') {
    return (
      <Card className="mb-6 border-black">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 text-black animate-spin" />
                <div>
                  <h3 className="font-semibold text-black">
                    Synchronisation en cours...
                  </h3>
                  <p className="text-sm text-gray-600">
                    {synced}/{total} produits synchronisés
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-black">{progress}%</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (syncStatus === 'success') {
    return (
      <Alert className="mb-6 border-green-300 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">
          Synchronisation terminée avec succès
        </AlertTitle>
        <AlertDescription className="text-green-700">
          <div className="mt-2 space-y-1">
            <p>✅ {synced} produits synchronisés</p>
            {failed > 0 && <p className="text-red-600">❌ {failed} échecs</p>}
            {skipped > 0 && (
              <p className="text-gray-600">⏭️ {skipped} ignorés</p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Durée: {(duration / 1000).toFixed(1)}s
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (syncStatus === 'error') {
    return (
      <Alert className="mb-6 border-red-300 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">
          Échec de synchronisation
        </AlertTitle>
        <AlertDescription className="text-red-700">
          <p>{error ?? 'Une erreur est survenue lors de la synchronisation'}</p>
          {failed > 0 && (
            <div className="mt-2 space-y-1">
              <p>❌ {failed} produits en échec</p>
              {synced > 0 && (
                <p>✅ {synced} produits synchronisés avant erreur</p>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
