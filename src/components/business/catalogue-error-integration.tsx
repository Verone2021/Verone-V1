/**
 * 📦 CATALOGUE ERROR INTEGRATION - EXEMPLE CONCRET
 *
 * Composant d'intégration montrant comment utiliser le système Error Reporting
 * dans le module Catalogue avec détection spécifique aux produits
 *
 * @author Vérone System Orchestrator
 * @version 2.0 - Révolutionnaire
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ButtonV2 } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
  RefreshCw,
  ShoppingCart,
  Database,
  Image,
  Clock
} from 'lucide-react'

import { useCatalogueErrorReporting } from '@/hooks/use-error-reporting-integration'

/**
 * 🎯 INTERFACES SPÉCIFIQUES CATALOGUE
 */
interface ProductErrorStats {
  product_load_errors: number
  image_load_errors: number
  pricing_calculation_errors: number
  availability_check_errors: number
}

interface CataloguePerformance {
  average_product_load_time: number
  total_products_scanned: number
  failed_products: string[]
  slow_products: Array<{
    id: string
    name: string
    load_time: number
  }>
}

/**
 * 🎛️ COMPOSANT PRINCIPAL : Intégration Catalogue Error Reporting
 */
export const CatalogueErrorIntegration: React.FC = () => {
  const {
    isActive,
    metrics,
    criticalErrorsCount,
    lastDetectionTime,
    getModuleErrorStats,
    getCriticalAlerts,
    reportProductLoadError,
    detectAndReportModuleErrors,
    reportError
  } = useCatalogueErrorReporting()

  const [catalogueStats, setCatalogueStats] = useState(getModuleErrorStats('catalogue'))
  const [productErrors, setProductErrors] = useState<ProductErrorStats>({
    product_load_errors: 0,
    image_load_errors: 0,
    pricing_calculation_errors: 0,
    availability_check_errors: 0
  })
  const [performance, setPerformance] = useState<CataloguePerformance>({
    average_product_load_time: 0,
    total_products_scanned: 0,
    failed_products: [],
    slow_products: []
  })
  const [isScanning, setIsScanning] = useState(false)

  // 🔄 Mise à jour stats périodique
  useEffect(() => {
    const updateStats = () => {
      setCatalogueStats(getModuleErrorStats('catalogue'))
    }

    const interval = setInterval(updateStats, 3000)
    updateStats()

    return () => clearInterval(interval)
  }, [getModuleErrorStats])

  // 🔍 Simulation scanning catalogue
  const simulateCatalogueScan = useCallback(async () => {
    setIsScanning(true)

    try {
      console.log('🔍 Démarrage scan catalogue...')

      // Simuler scan de 50 produits avec différents scénarios d'erreur
      const products = Array.from({ length: 50 }, (_, i) => ({
        id: `product_${i + 1}`,
        name: `Produit Test ${i + 1}`,
        load_time: Math.random() * 3000 + 500, // 0.5-3.5s
        has_error: Math.random() < 0.1 // 10% chance d'erreur
      }))

      let totalLoadTime = 0
      const failedProducts: string[] = []
      const slowProducts: Array<{ id: string; name: string; load_time: number }> = []

      for (const product of products) {
        totalLoadTime += product.load_time

        // 🚨 Produit avec erreur
        if (product.has_error) {
          failedProducts.push(product.id)

          // Simuler différents types d'erreurs catalogue
          const errorTypes = [
            { type: 'product_load', message: `Failed to load product data for ${product.id}` },
            { type: 'image_load', message: `Product image missing or corrupted for ${product.id}` },
            { type: 'pricing', message: `Pricing calculation error for ${product.id}` },
            { type: 'availability', message: `Stock availability check failed for ${product.id}` }
          ]

          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)]
          const error = new Error(errorType.message)

          // 📊 Incrémenter compteurs d'erreur
          setProductErrors(prev => ({
            ...prev,
            [`${errorType.type}_errors`]: (prev[`${errorType.type}_errors` as keyof ProductErrorStats] as number) + 1
          }))

          // 📝 Reporter l'erreur
          if (reportProductLoadError) {
            await reportProductLoadError(product.id, error)
          }
        }

        // 🐌 Produit lent (>2s considéré comme lent pour le catalogue)
        if (product.load_time > 2000) {
          slowProducts.push({
            id: product.id,
            name: product.name,
            load_time: product.load_time
          })

          // 🚨 Reporter erreur de performance
          const perfError = {
            id: `catalogue_perf_${product.id}_${Date.now()}`,
            type: 'performance' as any,
            severity: 'medium' as any,
            module: 'catalogue',
            message: `Slow product load detected: ${product.name} took ${Math.round(product.load_time)}ms`,
            context: {
              url: `/catalogue/${product.id}`,
              user_action: 'product_load',
              timestamp: new Date(),
              browser: navigator.userAgent,
              session_id: `cat_scan_${Date.now()}`,
              product_context: {
                product_id: product.id,
                product_name: product.name,
                load_time: product.load_time
              }
            },
            fix_priority: 6,
            estimated_fix_time: '45min',
            mcp_tools_needed: ['mcp__supabase__get_advisors', 'mcp__playwright__browser_evaluate'],
            auto_fixable: false,
            resolution_status: 'pending'
          }

          await reportError(perfError)
        }

        // Petit délai pour simuler le processing
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // 📊 Mise à jour métriques performance
      setPerformance({
        average_product_load_time: Math.round(totalLoadTime / products.length),
        total_products_scanned: products.length,
        failed_products: failedProducts,
        slow_products: slowProducts.slice(0, 5) // Top 5 des plus lents
      })

      console.log(`✅ Scan catalogue terminé: ${products.length} produits, ${failedProducts.length} erreurs`)

    } finally {
      setIsScanning(false)
    }
  }, [reportProductLoadError, reportError])

  // 🔍 Détection manuelle globale
  const handleGlobalDetection = async () => {
    setIsScanning(true)
    try {
      await detectAndReportModuleErrors('catalogue')
    } finally {
      setIsScanning(false)
    }
  }

  const alerts = getCriticalAlerts()

  return (
    <div className="space-y-6">
      {/* 🎯 HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Catalogue Error Protection
          </h2>
          <p className="text-sm text-gray-600">
            Surveillance intelligente des produits et performances catalogue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CatalogueStatusBadge
            isActive={isActive}
            criticalErrors={criticalErrorsCount}
            totalProducts={performance.total_products_scanned}
          />
          <ButtonV2
            onClick={simulateCatalogueScan}
            disabled={isScanning}
            variant="outline"
            size="sm"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            Scan Catalogue
          </ButtonV2>
          <ButtonV2
            onClick={handleGlobalDetection}
            disabled={isScanning}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Scan Global
          </ButtonV2>
        </div>
      </div>

      {/* 🚨 ALERTES CRITIQUES */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>CATALOGUE:</strong> {alert.message}
                <div className="text-xs text-red-600 mt-1">
                  {alert.timestamp.toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 📊 MÉTRIQUES PRINCIPALES */}
      <div className="grid gap-4 md:grid-cols-4">
        <CatalogueMetricsCard
          title="Erreurs Produits"
          value={catalogueStats.total_errors}
          subValue={`${catalogueStats.resolved_errors} résolues`}
          icon={AlertTriangle}
          color={catalogueStats.total_errors > 0 ? 'text-red-600' : 'text-green-600'}
          bgColor={catalogueStats.total_errors > 0 ? 'bg-red-100' : 'bg-green-100'}
        />

        <CatalogueMetricsCard
          title="Temps Moyen"
          value={`${performance.average_product_load_time}ms`}
          subValue="par produit"
          icon={Clock}
          color={performance.average_product_load_time > 2000 ? 'text-gray-700' : 'text-green-600'}
          bgColor={performance.average_product_load_time > 2000 ? 'bg-gray-100' : 'bg-green-100'}
        />

        <CatalogueMetricsCard
          title="Taux Succès"
          value={`${catalogueStats.success_rate}%`}
          subValue="auto-résolution"
          icon={CheckCircle}
          color={catalogueStats.success_rate >= 85 ? 'text-green-600' : 'text-red-600'}
          bgColor={catalogueStats.success_rate >= 85 ? 'bg-green-100' : 'bg-red-100'}
        />

        <CatalogueMetricsCard
          title="Produits Scannés"
          value={performance.total_products_scanned}
          subValue={`${performance.failed_products.length} échecs`}
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
      </div>

      {/* 📈 ANALYSE DÉTAILLÉE */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 🔍 Erreurs par type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Erreurs par Type</CardTitle>
            <CardDescription>Répartition des erreurs catalogue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ErrorTypeRow
                type="Chargement Produit"
                count={productErrors.product_load_errors}
                icon={Package}
                color="text-red-600"
              />
              <ErrorTypeRow
                type="Images Produit"
                count={productErrors.image_load_errors}
                icon={Image}
                color="text-black"
              />
              <ErrorTypeRow
                type="Calcul Prix"
                count={productErrors.pricing_calculation_errors}
                icon={ShoppingCart}
                color="text-purple-600"
              />
              <ErrorTypeRow
                type="Vérif Disponibilité"
                count={productErrors.availability_check_errors}
                icon={Database}
                color="text-blue-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* ⚡ Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Catalogue</CardTitle>
            <CardDescription>Produits avec temps de chargement élevés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.slow_products.length > 0 ? (
                performance.slow_products.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-black truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {product.id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800">
                        {Math.round(product.load_time)}ms
                      </div>
                      <Progress
                        value={Math.min((product.load_time / 3000) * 100, 100)}
                        className="w-16 h-1 mt-1"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Aucun produit lent détecté</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 💡 INTÉGRATION GUIDE */}
      <CatalogueIntegrationGuide />
    </div>
  )
}

/**
 * 🚦 STATUS BADGE : Badge statut catalogue
 */
const CatalogueStatusBadge: React.FC<{
  isActive: boolean
  criticalErrors: number
  totalProducts: number
}> = ({ isActive, criticalErrors, totalProducts }) => {
  if (!isActive) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Package className="w-3 h-3" />
        Protection Désactivée
      </Badge>
    )
  }

  if (criticalErrors > 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {criticalErrors} Erreur{criticalErrors > 1 ? 's' : ''} Critique{criticalErrors > 1 ? 's' : ''}
      </Badge>
    )
  }

  return (
    <Badge variant="default" className="flex items-center gap-1 bg-green-600">
      <CheckCircle className="w-3 h-3" />
      {totalProducts} Produits Surveillés
    </Badge>
  )
}

/**
 * 📊 METRICS CARD : Carte métriques catalogue
 */
const CatalogueMetricsCard: React.FC<{
  title: string
  value: string | number
  subValue: string
  icon: React.ElementType
  color: string
  bgColor: string
}> = ({ title, value, subValue, icon: Icon, color, bgColor }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-black">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subValue}</p>
          </div>
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 📝 ERROR TYPE ROW : Ligne d'erreur par type
 */
const ErrorTypeRow: React.FC<{
  type: string
  count: number
  icon: React.ElementType
  color: string
}> = ({ type, count, icon: Icon, color }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium text-black">{type}</span>
      </div>
      <Badge variant={count > 0 ? 'destructive' : 'secondary'}>
        {count}
      </Badge>
    </div>
  )
}

/**
 * 📖 GUIDE D'INTÉGRATION : Documentation
 */
const CatalogueIntegrationGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Guide d'Intégration Catalogue</CardTitle>
        <CardDescription>
          Comment intégrer Error Reporting dans vos composants produits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Patterns d'intégration pour le module Catalogue
            </p>
            <ButtonV2
              onClick={() => setShowGuide(!showGuide)}
              variant="outline"
              size="sm"
            >
              {showGuide ? 'Masquer' : 'Voir le Guide'}
            </ButtonV2>
          </div>

          {showGuide && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-900 mb-2">Détection Automatique</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Erreurs de chargement produit</li>
                    <li>• Images manquantes/corrompues</li>
                    <li>• Calculs de prix échoués</li>
                    <li>• Vérifications stock/disponibilité</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-medium text-blue-900 mb-2">SLOs Performance</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Chargement produit: {'<'}2s</li>
                    <li>• Page catalogue: {'<'}3s</li>
                    <li>• Recherche: {'<'}1s</li>
                    <li>• Images: {'<'}500ms</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs">
                <pre className="whitespace-pre-wrap">{`
// 🔍 EXEMPLE INTÉGRATION PRODUIT
import { useCatalogueErrorReporting } from '@/hooks/use-error-reporting-integration'

export function ProductCard({ productId }: { productId: string }) {
  const { reportProductLoadError } = useCatalogueErrorReporting()

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const startTime = performance.now()
        const product = await fetchProduct(productId)
        const loadTime = performance.now() - startTime

        // 🚨 Auto-report si lent
        if (loadTime > 2000) {
          await reportProductLoadError(productId, new Error(\`Slow load: \${loadTime}ms\`))
        }
      } catch (error) {
        // 📝 Report erreur de chargement
        await reportProductLoadError(productId, error)
      }
    }

    loadProduct()
  }, [productId])

  return <div>Product {productId}</div>
}`}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CatalogueErrorIntegration