/**
 * 🔧 Modal : Configuration Google Merchant Center
 *
 * Interface professionnelle pour tester et visualiser la configuration
 * Google Merchant Center (authentification, API, account info)
 */

'use client';

import { useState } from 'react';

import {
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info,
  Eye,
  EyeOff,
  ExternalLink,
  Package,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGoogleMerchantConfig } from '@/shared/modules/channels/hooks';

interface GoogleMerchantConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleMerchantConfigModal({
  open,
  onOpenChange,
}: GoogleMerchantConfigModalProps) {
  const {
    config,
    testing,
    connectionStatus,
    error,
    testDetails,
    testConnection,
    resetTest,
  } = useGoogleMerchantConfig();

  const [showCredentials, setShowCredentials] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-black max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            Configuration Google Merchant Center
          </DialogTitle>
          <DialogDescription>
            Testez et validez la connexion avec l'API Google Merchant Center
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge Principal */}
          <Card
            className={`border-2 ${
              connectionStatus === 'success'
                ? 'border-green-300 bg-green-50'
                : connectionStatus === 'error'
                  ? 'border-red-300 bg-red-50'
                  : connectionStatus === 'testing'
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {connectionStatus === 'success' && (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-bold text-green-900">
                          Connecté et opérationnel
                        </p>
                        <p className="text-sm text-green-700">
                          API Google Merchant Center accessible
                        </p>
                      </div>
                    </>
                  )}
                  {connectionStatus === 'error' && (
                    <>
                      <AlertCircle className="h-6 w-6 text-red-600" />
                      <div>
                        <p className="font-bold text-red-900">
                          Erreur de connexion
                        </p>
                        <p className="text-sm text-red-700">
                          Impossible de se connecter à l'API
                        </p>
                      </div>
                    </>
                  )}
                  {connectionStatus === 'testing' && (
                    <>
                      <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                      <div>
                        <p className="font-bold text-blue-900">
                          Test en cours...
                        </p>
                        <p className="text-sm text-blue-700">
                          Vérification authentification et API
                        </p>
                      </div>
                    </>
                  )}
                  {connectionStatus === 'idle' && (
                    <>
                      <Info className="h-6 w-6 text-gray-600" />
                      <div>
                        <p className="font-bold text-gray-900">
                          Prêt pour le test
                        </p>
                        <p className="text-sm text-gray-700">
                          Cliquez sur "Tester la connexion" pour valider
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {connectionStatus === 'success' && (
                  <Badge className="border-green-300 text-green-600 bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Validé
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuration Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">
                Informations du compte
              </h3>
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={() => setShowCredentials(!showCredentials)}
                className="text-gray-600 hover:text-black"
              >
                {showCredentials ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Masquer
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Afficher détails
                  </>
                )}
              </ButtonV2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-black">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Account ID</p>
                  <p className="font-mono text-lg font-bold text-black">
                    {config?.accountId || '5495521926'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-black">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Data Source ID</p>
                  <p className="font-mono text-lg font-bold text-black">
                    {config?.dataSourceId || '10571293810'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-black">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Langue / Pays</p>
                  <p className="font-medium text-black">
                    {config?.contentLanguage.toUpperCase() || 'FR'} /{' '}
                    {config?.targetCountry || 'FR'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-black">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Devise</p>
                  <p className="font-medium text-black">
                    {config?.currency || 'EUR'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Credentials (masqués par défaut) */}
            {showCredentials && (
              <Alert className="border-blue-300 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">
                  Variables d'environnement
                </AlertTitle>
                <AlertDescription className="text-blue-800 space-y-2 mt-2">
                  <div className="font-mono text-xs">
                    <p className="text-gray-700">
                      GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL
                    </p>
                    <p className="text-black break-all">
                      {process.env
                        .NEXT_PUBLIC_GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL ||
                        'google-merchant-verone@make-gmail-integration-428317.iam.gserviceaccount.com'}
                    </p>
                  </div>
                  <div className="font-mono text-xs">
                    <p className="text-gray-700">GOOGLE_CLOUD_PROJECT_ID</p>
                    <p className="text-black">
                      {process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID ||
                        'make-gmail-integration-428317'}
                    </p>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    🔒 Les clés privées ne sont jamais affichées pour des
                    raisons de sécurité
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Test Results - Success */}
          {connectionStatus === 'success' && testDetails && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-green-900">
                    Résultats du test
                  </h4>
                  <Badge className="border-green-400 text-green-700 bg-green-100">
                    {new Date(testDetails.timestamp).toLocaleString('fr-FR')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Authentification: <strong>Réussie</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      API Connection: <strong>Réussie</strong>
                    </span>
                  </div>
                </div>

                {testDetails.details?.productListTest && (
                  <div className="pt-2 border-t border-green-300">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-800">
                        Produits synchronisés détectés:{' '}
                        <strong className="text-green-900">
                          {testDetails.details.productListTest.productCount ||
                            0}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="w-full border-green-400 text-green-700 hover:bg-green-100"
                  onClick={() =>
                    window.open(
                      `https://merchants.google.com/mc/accounts/${config?.accountId}`,
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir Google Merchant Center
                </ButtonV2>
              </CardContent>
            </Card>
          )}

          {/* Test Results - Error */}
          {connectionStatus === 'error' && error && (
            <Alert className="border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">
                Erreur de connexion
              </AlertTitle>
              <AlertDescription className="text-red-800">
                <p className="font-mono text-sm mt-2 bg-red-100 p-3 rounded border border-red-200">
                  {error}
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-semibold">Vérifications recommandées :</p>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    <li>Variables d'environnement .env.local correctes</li>
                    <li>Service Account ajouté dans Google Merchant Center</li>
                    <li>API Content activée dans Google Cloud Console</li>
                    <li>Account ID et Data Source ID corrects</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <ButtonV2
              onClick={testConnection}
              disabled={testing}
              className="flex-1 bg-black hover:bg-gray-800 text-white"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tester la connexion
                </>
              )}
            </ButtonV2>

            {connectionStatus !== 'idle' && (
              <ButtonV2
                variant="outline"
                onClick={resetTest}
                className="border-black text-black hover:bg-gray-100"
              >
                Réinitialiser
              </ButtonV2>
            )}

            <ButtonV2
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Fermer
            </ButtonV2>
          </div>

          {/* Documentation Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Besoin d'aide ?{' '}
              <a
                href="/docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md"
                className="text-black underline hover:text-gray-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Consulter la documentation complète
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
