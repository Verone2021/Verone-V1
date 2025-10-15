"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBag,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  FileSpreadsheet,
  Globe,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ConnectionStatus {
  authentication: boolean
  apiConnection: boolean
  accountId: string
  dataSourceId: string
  timestamp: string
}

interface SyncResult {
  success: boolean
  data?: any
  error?: string
}

export default function GoogleMerchantAdminPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSyncing, setSyncing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const { toast } = useToast()

  // Test de connexion au chargement
  useEffect(() => {
    testConnection()
  }, [])

  /**
   * Teste la connexion Google Merchant Center
   */
  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const response = await fetch('/api/google-merchant/test-connection')
      const result = await response.json()

      if (result.success) {
        setConnectionStatus(result.data)
        toast({
          title: "✅ Connexion réussie",
          description: "Google Merchant Center est bien configuré"
        })
      } else {
        console.error('Connection test failed:', result)
        toast({
          title: "❌ Connexion échouée",
          description: result.error || "Erreur de connexion",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Connection test error:', error)
      toast({
        title: "❌ Erreur réseau",
        description: "Impossible de tester la connexion",
        variant: "destructive"
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  /**
   * Synchronise un produit test
   */
  const syncTestProduct = async () => {
    setSyncing(true)
    try {
      // Récupérer un produit test (premier de la liste)
      const productsResponse = await fetch('/api/products?limit=1')
      const productsData = await productsResponse.json()

      if (!productsData.data || productsData.data.length === 0) {
        toast({
          title: "⚠️ Aucun produit",
          description: "Aucun produit disponible pour test",
          variant: "destructive"
        })
        return
      }

      const testProduct = productsData.data[0]

      // Synchroniser avec Google Merchant
      const syncResponse = await fetch(`/api/google-merchant/sync-product/${testProduct.id}`, {
        method: 'POST'
      })
      const syncResult = await syncResponse.json()

      setSyncResults(prev => [syncResult, ...prev.slice(0, 4)]) // Garder 5 derniers résultats

      if (syncResult.success) {
        toast({
          title: "✅ Synchronisation réussie",
          description: `Produit ${testProduct.sku} synchronisé avec Google`
        })
      } else {
        toast({
          title: "❌ Synchronisation échouée",
          description: syncResult.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "❌ Erreur sync",
        description: "Erreur lors de la synchronisation",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  /**
   * Export Excel Google Merchant
   */
  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/exports/google-merchant-excel?limit=10')

      if (response.ok) {
        // Téléchargement du fichier
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `google-merchant-products-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: "✅ Export réussi",
          description: "Fichier Excel téléchargé"
        })
      } else {
        const error = await response.json()
        toast({
          title: "❌ Export échoué",
          description: error.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "❌ Erreur export",
        description: "Erreur lors de l'export Excel",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black flex items-center">
                <ShoppingBag className="h-8 w-8 mr-3" />
                Google Merchant Center
              </h1>
              <p className="text-gray-600 mt-1">Configuration et gestion de l'intégration Google Merchant</p>
            </div>
            <ButtonV2
              variant="outline"
              onClick={testConnection}
              disabled={isTestingConnection}
              className="border-black text-black hover:bg-black hover:text-white"
            >
              {isTestingConnection ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Test Connexion
            </ButtonV2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Statut de Connexion */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Statut de Connexion
            </CardTitle>
            <CardDescription>État de la connexion avec Google Merchant Center</CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">Authentification</span>
                  {connectionStatus.authentication ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connecté
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Échec
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">API Connection</span>
                  {connectionStatus.apiConnection ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>

                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <span className="text-sm text-gray-600">Account ID</span>
                    <p className="font-mono text-sm">{connectionStatus.accountId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Data Source ID</span>
                    <p className="font-mono text-sm">{connectionStatus.dataSourceId}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Test de connexion en cours...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Synchronisation */}
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Synchronisation Produit
              </CardTitle>
              <CardDescription>Synchroniser les produits avec Google Merchant Center</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ButtonV2
                onClick={syncTestProduct}
                disabled={isSyncing || !connectionStatus?.apiConnection}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Synchroniser Produit Test
              </ButtonV2>

              {syncResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Derniers Résultats :</h4>
                  {syncResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-xs border ${
                        result.success
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >
                      {result.success ? (
                        <span>✅ {result.data?.sku} synchronisé</span>
                      ) : (
                        <span>❌ {result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Excel */}
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Export Excel
              </CardTitle>
              <CardDescription>Télécharger les produits au format Google Merchant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ButtonV2
                onClick={exportToExcel}
                disabled={isExporting}
                variant="outline"
                className="w-full border-black text-black hover:bg-black hover:text-white"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Télécharger Excel (10 produits)
              </ButtonV2>

              <div className="text-xs text-gray-600 space-y-1">
                <p>• Format conforme template Google Merchant</p>
                <p>• 31 colonnes exactes du template fourni</p>
                <p>• Mapping automatique depuis la base de données</p>
                <p>• Prêt pour upload direct dans Google Merchant Center</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Configuration</CardTitle>
            <CardDescription>Informations sur la configuration actuelle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Content Language</span>
                <p className="font-mono">fr</p>
              </div>
              <div>
                <span className="text-gray-600">Target Country</span>
                <p className="font-mono">FR</p>
              </div>
              <div>
                <span className="text-gray-600">Currency</span>
                <p className="font-mono">EUR</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-600">
                Pour configurer l'intégration Google Merchant Center, consultez le fichier{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">SETUP-GOOGLE-MERCHANT.md</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}