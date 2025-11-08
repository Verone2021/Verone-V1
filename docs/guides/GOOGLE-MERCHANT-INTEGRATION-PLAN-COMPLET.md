# 🚀 Plan Complet - Intégration Google Merchant Center Professionnelle

**Projet** : Vérone Back Office - CRM/ERP Modulaire
**Module** : Canaux de Vente → Google Merchant Center
**Date création** : 2025-01-10
**Statut** : Plan Détaillé - Prêt pour Implémentation

---

## 📋 Vue d'Ensemble

### Objectif Principal

Développer une **intégration professionnelle complète** avec Google Merchant Center pour synchroniser le catalogue Vérone avec Google Shopping et suivre les performances en temps réel.

### Scope Fonctionnel

1. ✅ **Configuration API** - Service Account authentification (FAIT)
2. 🔧 **Modal Configuration** - Interface utilisateur setup Google Merchant
3. 🔄 **Synchronisation Bidirectionnelle** - Vérone ↔ Google Merchant
4. 📊 **Dashboard Analytics** - Métriques temps réel (impressions, clics, conversions)
5. 🎯 **Gestion Produits** - Sélection, export, monitoring
6. 🔔 **Notifications** - Alertes automatiques (erreurs, validations)

### Architecture Actuelle (Analyse Complète)

#### ✅ Déjà Implémenté

```typescript
// 1. Authentification (src/lib/google-merchant/auth.ts)
✅ Service Account authentication
✅ JWT token generation
✅ OAuth2 headers
✅ Singleton pattern

// 2. Configuration (src/lib/google-merchant/config.ts)
✅ Account ID: 5495521926
✅ Data Source ID: 10571293810
✅ Content language: FR
✅ Feed label: FR
✅ Rate limiting config

// 3. API Client (src/lib/google-merchant/client.ts)
✅ insertProduct() - Merchant API v1beta
✅ updateProduct() - Via insert (upsert)
✅ deleteProduct()
✅ getProduct()
✅ listProducts()
✅ batchSyncProducts()
✅ testConnection()

// 4. Data Transformer (src/lib/google-merchant/transformer.ts)
✅ Vérone Product → Google Merchant Product
✅ 31 champs Google mappés
✅ Validation produits
✅ Image extraction
✅ Variant attributes (couleur, matériau, taille)
✅ Shipping configuration

// 5. API Routes
✅ /api/google-merchant/test-connection (GET, POST)
✅ /api/google-merchant/sync-product/[id] (POST)
```

#### ❌ Interface Mockée (À Développer)

```typescript
// src/app/canaux-vente/google-merchant/page.tsx
❌ Configuration modal (bouton non fonctionnel)
❌ Synchronisation produits (données mockées)
❌ Métriques analytics (données statiques)
❌ Sélection produits catalogue (placeholder)
❌ Connexion API réelle (simulation)
```

---

## 🎯 Plan d'Implémentation Détaillé

### Phase 1 : Modal Configuration Google Merchant (2-3h)

#### Objectif

Créer une interface professionnelle pour tester/configurer la connexion API Google Merchant.

#### Composant : `ConfigurationModal.tsx`

**Features**:

- **Test Connexion** : Bouton avec feedback visuel
- **Affichage Credentials** : Masqué par défaut, révélable
- **Statut Account** : Vérifié, Data Source validé
- **Diagnostic** : Logs détaillés en cas d'erreur
- **Actions** :
  - ✅ Tester l'authentification
  - ✅ Valider Account ID
  - ✅ Vérifier Data Source
  - ✅ Lister produits existants (proof of concept)

**API Integration**:

```typescript
// Hook personnalisé
export function useGoogleMerchantConfig() {
  const [config, setConfig] = useState<MerchantConfig | null>(null);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');

  async function testConnection() {
    setTesting(true);
    setConnectionStatus('testing');

    try {
      // 1. Test authentification
      const authResponse = await fetch('/api/google-merchant/test-connection');
      const authData = await authResponse.json();

      if (!authData.success) {
        throw new Error(authData.error || 'Authentication failed');
      }

      // 2. Test API connection
      const apiResponse = await fetch('/api/google-merchant/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeProductList: true }),
      });
      const apiData = await apiResponse.json();

      if (apiData.success) {
        setConfig({
          accountId: authData.data.accountId,
          dataSourceId: authData.data.dataSourceId,
          authenticated: true,
          apiConnected: true,
          productCount:
            apiData.data.details?.productListTest?.productCount || 0,
        });
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  }

  return { config, testing, connectionStatus, testConnection };
}
```

**UI/UX Design** (Vérone minimalist):

```typescript
<Dialog>
  <DialogContent className="max-w-2xl border-black">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-black flex items-center">
        <Settings className="h-6 w-6 mr-2" />
        Configuration Google Merchant Center
      </DialogTitle>
    </DialogHeader>

    {/* Status Badge */}
    <div className="bg-gray-50 border border-gray-200 rounded p-4">
      {connectionStatus === 'success' && (
        <Badge className="border-green-300 text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          Connecté et opérationnel
        </Badge>
      )}
    </div>

    {/* Credentials (Read-only) */}
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-600">Account ID</label>
        <p className="font-mono text-black">{config?.accountId || '5495521926'}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600">Data Source ID</label>
        <p className="font-mono text-black">{config?.dataSourceId || '10571293810'}</p>
      </div>
    </div>

    {/* Test Connection Button */}
    <Button
      onClick={testConnection}
      disabled={testing}
      className="w-full bg-black hover:bg-gray-800 text-white"
    >
      {testing ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4 mr-2" />
      )}
      {testing ? 'Test en cours...' : 'Tester la connexion'}
    </Button>

    {/* Diagnostic Logs */}
    {connectionStatus === 'error' && (
      <Alert className="border-red-300 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Erreur de connexion</AlertTitle>
        <AlertDescription className="text-red-700 font-mono text-sm">
          {/* Afficher détails erreur */}
        </AlertDescription>
      </Alert>
    )}
  </DialogContent>
</Dialog>
```

**Fichiers à créer**:

- `src/components/business/google-merchant-config-modal.tsx`
- `src/hooks/use-google-merchant-config.ts`

---

### Phase 2 : Synchronisation Produits Complète (3-4h)

#### Objectif

Implémenter la synchronisation bidirectionnelle Vérone ↔ Google Merchant avec sélection produits depuis le catalogue.

#### Features Principales

**1. Sélection Produits depuis Catalogue**

```typescript
// Hook : useGoogleMerchantSync.ts
export function useGoogleMerchantSync() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState({
    total: 0,
    completed: 0,
    errors: 0,
    status: 'idle' as 'idle' | 'syncing' | 'success' | 'error',
  });

  async function syncProducts(productIds: string[]) {
    setSyncProgress({
      total: productIds.length,
      completed: 0,
      errors: 0,
      status: 'syncing',
    });

    const results = [];

    for (const productId of productIds) {
      try {
        const response = await fetch(
          `/api/google-merchant/sync-product/${productId}`,
          {
            method: 'POST',
          }
        );
        const data = await response.json();

        if (data.success) {
          setSyncProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
          }));
        } else {
          setSyncProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            errors: prev.errors + 1,
          }));
        }

        results.push(data);
      } catch (error) {
        setSyncProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
          errors: prev.errors + 1,
        }));
      }

      // Respect rate limits (5 req/s selon config)
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setSyncProgress(prev => ({
      ...prev,
      status: prev.errors === 0 ? 'success' : 'error',
    }));

    return results;
  }

  return {
    selectedProducts,
    setSelectedProducts,
    syncProgress,
    syncProducts,
  };
}
```

**2. Interface Sélection Produits**

Intégration avec `useProducts` hook existant:

```typescript
// Dans la page Google Merchant
import { useProducts } from '@/hooks/use-products'
import { useGoogleMerchantSync } from '@/hooks/use-google-merchant-sync'

export default function GoogleMerchantPage() {
  const { products, loading } = useProducts()
  const { selectedProducts, setSelectedProducts, syncProducts, syncProgress } = useGoogleMerchantSync()

  // Filtrer produits éligibles (GTIN, images, description)
  const eligibleProducts = products.filter(p =>
    p.gtin && p.images && p.images.length > 0 && p.description
  )

  async function handleExportSelected() {
    if (selectedProducts.length === 0) return
    await syncProducts(selectedProducts)
  }

  return (
    <div>
      {/* Table avec sélection multiple */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedProducts.length === eligibleProducts.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedProducts(eligibleProducts.map(p => p.id))
                  } else {
                    setSelectedProducts([])
                  }
                }}
              />
            </TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>Prix HT</TableHead>
            <TableHead>GTIN</TableHead>
            <TableHead>Images</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eligibleProducts.map(product => (
            <TableRow key={product.id}>
              <TableCell>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProducts([...selectedProducts, product.id])
                    } else {
                      setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                    }
                  }}
                />
              </TableCell>
              <TableCell className="font-mono">{product.sku}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{formatCurrency(product.price_ht)}</TableCell>
              <TableCell>{product.gtin || <Badge variant="outline">Manquant</Badge>}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {product.images?.length || 0} image(s)
                </Badge>
              </TableCell>
              <TableCell>
                {/* Badge statut synchronisation */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Progress Bar pendant sync */}
      {syncProgress.status === 'syncing' && (
        <Card className="mt-4 border-blue-300 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Synchronisation en cours...
                </span>
                <span className="text-sm text-blue-700">
                  {syncProgress.completed} / {syncProgress.total}
                </span>
              </div>
              <Progress
                value={(syncProgress.completed / syncProgress.total) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

**3. API Route : Sync Product Extended**

Amélioration de `/api/google-merchant/sync-product/[id]/route.ts`:

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const timer = logger.startTimer();
  const productId = params.id;

  try {
    // 1. Récupérer produit depuis Supabase avec relations
    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
        *,
        supplier:suppliers(id, name),
        subcategory:subcategories(id, name, google_category),
        images:product_images(*)
      `
      )
      .eq('id', productId)
      .single();

    if (error || !product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produit non trouvé',
        },
        { status: 404 }
      );
    }

    // 2. Synchroniser avec Google Merchant
    const client = getGoogleMerchantClient();
    const result = await client.insertProduct(product);

    // 3. Sauvegarder metadata synchronisation dans DB
    if (result.success) {
      await supabase.from('google_merchant_syncs').insert({
        product_id: productId,
        google_product_id: result.data?.name,
        sync_status: 'success',
        synced_at: new Date().toISOString(),
      });
    }

    const duration = timer();
    logger.info(
      'Product sync completed',
      {
        operation: 'product_sync',
        productId,
        success: result.success,
      },
      { duration_ms: duration }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Product sync failed', error, {
      operation: 'product_sync_failed',
      productId,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

**Fichiers à créer/modifier**:

- `src/hooks/use-google-merchant-sync.ts` (nouveau)
- `src/app/api/google-merchant/sync-product/[id]/route.ts` (améliorer)
- `src/app/canaux-vente/google-merchant/page.tsx` (refactorer onglet "Ajouter des Produits")

---

### Phase 3 : Dashboard Analytics & Métriques (4-5h)

#### Objectif

Récupérer et afficher les métriques Google Shopping en temps réel (impressions, clics, conversions).

#### API Google Merchant - Reports

**Documentation Officielle** :
https://developers.google.com/merchant/api/guides/reports/performance-reports

**Merchant Center Query Language** :
https://developers.google.com/shopping-content/guides/reports/query-language/overview

#### Implementation

**1. Nouveau Client : GoogleMerchantReportsClient**

```typescript
// src/lib/google-merchant/reports-client.ts
import { getGoogleMerchantAuth } from './auth';
import { GOOGLE_MERCHANT_CONFIG } from './config';

export interface PerformanceMetrics {
  productId: string;
  sku: string;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  conversions: number;
  conversionRate: number;
  averagePrice: number;
  totalRevenue: number;
  date: string;
}

export class GoogleMerchantReportsClient {
  private auth: ReturnType<typeof getGoogleMerchantAuth>;
  private baseUrl: string;
  private accountId: string;

  constructor() {
    this.auth = getGoogleMerchantAuth();
    this.baseUrl = GOOGLE_MERCHANT_CONFIG.baseUrl;
    this.accountId = GOOGLE_MERCHANT_CONFIG.accountId;
  }

  /**
   * Récupère les métriques de performance pour une période donnée
   * Utilise la Merchant Center Query Language
   */
  async getPerformanceMetrics(
    startDate: string, // Format: YYYY-MM-DD
    endDate: string
  ): Promise<{
    success: boolean;
    data?: PerformanceMetrics[];
    error?: string;
  }> {
    try {
      const headers = await this.auth.getAuthHeaders();

      // Query Merchant Center Query Language
      const query = `
        SELECT
          segments.program,
          segments.offer_id,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.conversions,
          metrics.conversion_rate,
          metrics.average_price,
          metrics.revenue
        FROM MerchantPerformanceView
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      `;

      const url = `${this.baseUrl}/accounts/${this.accountId}/reports:search`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'Failed to fetch metrics',
        };
      }

      const data = await response.json();

      // Transformer la réponse Google vers notre format
      const metrics: PerformanceMetrics[] =
        data.results?.map((result: any) => ({
          productId: result.segments?.offer_id || '',
          sku: result.segments?.offer_id || '',
          impressions: result.metrics?.impressions || 0,
          clicks: result.metrics?.clicks || 0,
          clickThroughRate: result.metrics?.ctr || 0,
          conversions: result.metrics?.conversions || 0,
          conversionRate: result.metrics?.conversion_rate || 0,
          averagePrice: result.metrics?.average_price?.amountMicros
            ? result.metrics.average_price.amountMicros / 1_000_000
            : 0,
          totalRevenue: result.metrics?.revenue?.amountMicros
            ? result.metrics.revenue.amountMicros / 1_000_000
            : 0,
          date: endDate,
        })) || [];

      return { success: true, data: metrics };
    } catch (error: any) {
      console.error('[Reports Client] Error fetching metrics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Récupère les métriques agrégées pour le dashboard
   */
  async getDashboardMetrics(dateRange: {
    startDate: string;
    endDate: string;
  }): Promise<{
    success: boolean;
    data?: {
      totalImpressions: number;
      totalClicks: number;
      averageCTR: number;
      totalConversions: number;
      averageConversionRate: number;
      totalRevenue: number;
      productCount: number;
    };
    error?: string;
  }> {
    try {
      const metricsResult = await this.getPerformanceMetrics(
        dateRange.startDate,
        dateRange.endDate
      );

      if (!metricsResult.success || !metricsResult.data) {
        return metricsResult;
      }

      const metrics = metricsResult.data;

      // Agréger les métriques
      const aggregated = {
        totalImpressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
        totalClicks: metrics.reduce((sum, m) => sum + m.clicks, 0),
        totalConversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
        totalRevenue: metrics.reduce((sum, m) => sum + m.totalRevenue, 0),
        productCount: metrics.length,
        averageCTR: 0,
        averageConversionRate: 0,
      };

      // Calculer moyennes
      if (aggregated.totalImpressions > 0) {
        aggregated.averageCTR =
          (aggregated.totalClicks / aggregated.totalImpressions) * 100;
      }

      if (aggregated.totalClicks > 0) {
        aggregated.averageConversionRate =
          (aggregated.totalConversions / aggregated.totalClicks) * 100;
      }

      return {
        success: true,
        data: aggregated,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Singleton instance
let reportsClientInstance: GoogleMerchantReportsClient | null = null;

export function getGoogleMerchantReportsClient(): GoogleMerchantReportsClient {
  if (!reportsClientInstance) {
    reportsClientInstance = new GoogleMerchantReportsClient();
  }
  return reportsClientInstance;
}
```

**2. API Route : Métriques Dashboard**

```typescript
// src/app/api/google-merchant/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleMerchantReportsClient } from '@/lib/google-merchant/reports-client';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const timer = logger.startTimer();
  const { searchParams } = new URL(request.url);

  // Paramètres date range (défaut: 30 derniers jours)
  const endDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const startDate =
    searchParams.get('startDate') ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const reportsClient = getGoogleMerchantReportsClient();

    const result = await reportsClient.getDashboardMetrics({
      startDate,
      endDate: searchParams.get('endDate') || endDate,
    });

    const duration = timer();
    logger.info(
      'Metrics fetched successfully',
      {
        operation: 'fetch_metrics',
        startDate,
        endDate,
        success: result.success,
      },
      { duration_ms: duration }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Failed to fetch metrics', error, {
      operation: 'fetch_metrics_failed',
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

**3. Hook : useMerchantMetrics**

```typescript
// src/hooks/use-merchant-metrics.ts
import { useState, useEffect } from 'react';

interface DashboardMetrics {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  totalConversions: number;
  averageConversionRate: number;
  totalRevenue: number;
  productCount: number;
}

export function useMerchantMetrics(dateRange?: {
  startDate?: string;
  endDate?: string;
}) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.set('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.set('endDate', dateRange.endDate);

      const response = await fetch(`/api/google-merchant/metrics?${params}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(data.error || 'Failed to fetch metrics');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMetrics();
  }, [dateRange?.startDate, dateRange?.endDate]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
```

**4. UI Dashboard Analytics**

```typescript
// Dans GoogleMerchantPage
import { useMerchantMetrics } from '@/hooks/use-merchant-metrics'

export default function GoogleMerchantPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const { metrics, loading, error, refetch } = useMerchantMetrics(dateRange)

  if (loading) {
    return <div>Chargement des métriques...</div>
  }

  if (error) {
    return (
      <Alert className="border-red-300 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      {/* Date Range Selector */}
      <div className="flex items-center space-x-3 mb-6">
        <Input
          type="date"
          value={dateRange.startDate}
          onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          className="border-black"
        />
        <span className="text-gray-600">à</span>
        <Input
          type="date"
          value={dateRange.endDate}
          onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          className="border-black"
        />
        <Button onClick={refetch} className="bg-black hover:bg-gray-800 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques (RÉELLES maintenant) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Produits"
          value={metrics?.productCount || 0}
          icon={<Package />}
          color="black"
        />
        <MetricCard
          title="Impressions"
          value={metrics?.totalImpressions.toLocaleString('fr-FR') || 0}
          icon={<BarChart />}
          color="blue"
        />
        <MetricCard
          title="Clics"
          value={metrics?.totalClicks || 0}
          icon={<ShoppingBag />}
          color="purple"
        />
        <MetricCard
          title="CTR Moyen"
          value={`${metrics?.averageCTR.toFixed(2)}%` || '0%'}
          icon={<TrendingUp />}
          color="green"
        />
        <MetricCard
          title="Conversions"
          value={metrics?.totalConversions || 0}
          icon={<Euro />}
          color="black"
        />
        <MetricCard
          title="Taux Conv."
          value={`${metrics?.averageConversionRate.toFixed(2)}%` || '0%'}
          icon={<CheckCircle />}
          color="green"
        />
      </div>
    </div>
  )
}
```

**Fichiers à créer**:

- `src/lib/google-merchant/reports-client.ts` (nouveau)
- `src/app/api/google-merchant/metrics/route.ts` (nouveau)
- `src/hooks/use-merchant-metrics.ts` (nouveau)
- `src/app/canaux-vente/google-merchant/page.tsx` (refactorer statistiques)

---

### Phase 4 : Features Avancées (2-3h)

#### 1. Gestion Produits Synchronisés

**Features**:

- Liste produits synchronisés avec métriques individuelles
- Filtres : Statut Google (approved, pending, rejected)
- Actions individuelles : Re-sync, Supprimer de Google, Voir détails
- Lien externe vers Google Merchant Center

**Implementation**:

```typescript
// Hook : useGoogleMerchantProducts
export function useGoogleMerchantProducts() {
  const [products, setProducts] = useState<GoogleMerchantProduct[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSyncedProducts() {
    setLoading(true);
    try {
      // 1. Récupérer produits depuis DB avec metadata sync
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          google_merchant_syncs!inner(
            google_product_id,
            sync_status,
            synced_at,
            error_message
          )
        `
        )
        .eq('google_merchant_syncs.sync_status', 'success');

      if (error) throw error;

      // 2. Récupérer métriques Google pour chaque produit
      const metricsResponse = await fetch('/api/google-merchant/metrics');
      const metricsData = await metricsResponse.json();

      // 3. Merger produits + métriques
      const productsWithMetrics = data?.map(product => ({
        ...product,
        metrics: metricsData.data?.find((m: any) => m.sku === product.sku),
      }));

      setProducts(productsWithMetrics || []);
    } catch (error) {
      console.error('Failed to fetch synced products:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSyncedProducts();
  }, []);

  return {
    products,
    loading,
    refetch: fetchSyncedProducts,
  };
}
```

#### 2. Notifications & Alertes

**Features**:

- Toast notifications pour succès/erreur sync
- Alertes produits rejetés par Google
- Badge count produits en attente de validation

**Implementation** (utiliser `sonner` toast):

```typescript
import { toast } from 'sonner';

// Après sync produit
if (syncResult.success) {
  toast.success('Produit synchronisé avec succès', {
    description: `${product.name} (${product.sku})`,
    duration: 3000,
  });
} else {
  toast.error('Échec synchronisation produit', {
    description: syncResult.error,
    duration: 5000,
    action: {
      label: 'Réessayer',
      onClick: () => retrySync(product.id),
    },
  });
}
```

#### 3. Export Batch & Webhooks

**Features**:

- Export CSV des métriques
- Webhooks Google Merchant (notifications produits rejetés)
- Synchronisation automatique scheduled (cron job)

---

## 🔧 Stack Technique

### APIs & Services

- **Google Merchant API v1beta** : Produits insert/update/delete
- **Google Merchant Reports API** : Métriques performances
- **Merchant Center Query Language** : Queries analytics

### Frontend

- **React 18** + **Next.js 15** App Router
- **shadcn/ui** : Components Vérone design system
- **Tailwind CSS** : Styling minimalist
- **Tanstack Query** (optionnel) : Cache métriques

### Backend

- **Next.js API Routes** : Endpoints proxy Google API
- **Supabase** : DB produits + metadata sync
- **google-auth-library** : Service Account auth

### Monitoring

- **Logger custom** : Logs structurés
- **Sentry** (optionnel) : Error tracking production

---

## 📊 Structure Base de Données

### Nouvelle Table : `google_merchant_syncs`

```sql
CREATE TABLE google_merchant_syncs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  google_product_id TEXT NOT NULL, -- Format: accounts/{accountId}/products/{contentLanguage}~{feedLabel}~{offerId}
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'pending', 'error')),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  google_status TEXT, -- approved, pending, rejected
  last_metrics_fetch TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(product_id) -- Un produit = une seule sync active
);

CREATE INDEX idx_google_merchant_syncs_product ON google_merchant_syncs(product_id);
CREATE INDEX idx_google_merchant_syncs_status ON google_merchant_syncs(sync_status);
CREATE INDEX idx_google_merchant_syncs_google_status ON google_merchant_syncs(google_status);
```

### Migration Supabase

```typescript
// supabase/migrations/20250110_google_merchant_syncs.sql
-- Migration créée automatiquement
-- Exécuter via: npx supabase migration new google_merchant_syncs
```

---

## ✅ Checklist Implémentation

### Phase 1 : Modal Configuration (2-3h)

- [ ] Créer `ConfigurationModal.tsx` component
- [ ] Créer `useGoogleMerchantConfig` hook
- [ ] Intégrer modal dans page Google Merchant
- [ ] Tester connexion API end-to-end
- [ ] Validation visuelle (screenshots)

### Phase 2 : Synchronisation Produits (3-4h)

- [ ] Créer `useGoogleMerchantSync` hook
- [ ] Intégrer sélection produits depuis catalogue (`useProducts`)
- [ ] Progress bar synchronisation
- [ ] Améliorer API route `sync-product/[id]`
- [ ] Créer table `google_merchant_syncs` (migration Supabase)
- [ ] Tests avec 1-5 produits réels

### Phase 3 : Dashboard Analytics (4-5h)

- [ ] Créer `GoogleMerchantReportsClient` class
- [ ] API route `/api/google-merchant/metrics`
- [ ] Hook `useMerchantMetrics`
- [ ] Refactorer statistiques (données réelles)
- [ ] Date range selector
- [ ] Tests métriques période 7j, 30j, 90j

### Phase 4 : Features Avancées (2-3h)

- [ ] Hook `useGoogleMerchantProducts` (liste synchronisés)
- [ ] Actions individuelles (re-sync, delete)
- [ ] Notifications toast (sonner)
- [ ] Export CSV métriques
- [ ] Lien externe Google Merchant Center

### Phase 5 : Tests & Validation (1-2h)

- [ ] Console error checking MCP Playwright (MANDATORY)
- [ ] Tests end-to-end workflow complet
- [ ] Documentation utilisateur (guide)
- [ ] Screenshots interface finale
- [ ] Code review

**Total estimé** : 12-17 heures de développement

---

## 🎯 Critères de Succès

### Fonctionnalités ✅

1. ✅ Modal configuration avec test connexion fonctionnel
2. ✅ Synchronisation produits depuis catalogue Vérone
3. ✅ Dashboard analytics avec métriques temps réel Google
4. ✅ Gestion produits synchronisés (liste, actions)
5. ✅ Notifications visuelles synchronisation
6. ✅ Interface 100% fonctionnelle (zéro mock data)

### Qualité Code ✅

1. ✅ TypeScript strict (aucun `any` non justifié)
2. ✅ Logs structurés (logger custom)
3. ✅ Error handling robuste
4. ✅ Rate limiting respecté (5 req/s Google API)
5. ✅ Console 100% clean (MCP Playwright validation)

### Performance ✅

1. ✅ Sync 100 produits < 30s (respect rate limits)
2. ✅ Dashboard load < 2s (métriques 30 jours)
3. ✅ UI responsive (aucun blocking)

### Documentation ✅

1. ✅ Guide utilisateur complet
2. ✅ Documentation API routes
3. ✅ Commentaires code critiques

---

## 🔗 Ressources & Documentation

### Documentation Officielle Google

- [Content API for Shopping](https://developers.google.com/shopping-content)
- [Merchant API Overview](https://developers.google.com/merchant/api/overview)
- [Performance Reports](https://developers.google.com/merchant/api/guides/reports/performance-reports)
- [Query Language](https://developers.google.com/shopping-content/guides/reports/query-language/overview)
- [Best Practices](https://developers.google.com/shopping-content/guides/best-practices)

### Bibliothèques Node.js

- [googleapis](https://www.npmjs.com/package/googleapis) - Client officiel Google
- [google-auth-library](https://www.npmjs.com/package/google-auth-library) - Authentification

### GitHub Samples

- [google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client)
- [merchant-api-samples](https://github.com/google/merchant-api-samples)

### Vérone Internal Docs

- [GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md](./GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md)
- [GOOGLE-MERCHANT-SERVICE-ACCOUNT-CREDENTIALS.md](./GOOGLE-MERCHANT-SERVICE-ACCOUNT-CREDENTIALS.md)
- [GOOGLE-MERCHANT-DOMAIN-VERIFICATION.md](./GOOGLE-MERCHANT-DOMAIN-VERIFICATION.md)

---

## 🚀 Next Steps

### Immédiat (Après validation plan)

1. **Phase 1** : Modal Configuration (commencer maintenant)
2. **Tests** : Validation connexion API temps réel
3. **Documentation** : Screenshots modal configuration

### Court terme (Cette semaine)

1. **Phase 2** : Synchronisation produits
2. **Migration DB** : Table `google_merchant_syncs`
3. **Tests** : Sync 5-10 produits réels

### Moyen terme (Semaine prochaine)

1. **Phase 3** : Dashboard analytics
2. **Phase 4** : Features avancées
3. **Phase 5** : Tests complets + validation

---

**Créé le** : 2025-01-10
**Auteur** : Claude Code (Vérone Back Office Team)
**Version** : 1.0 - Plan Détaillé Complet
**Statut** : ✅ Prêt pour Implémentation

🎯 **Objectif** : Intégration Google Merchant Center 100% professionnelle, zéro mock data, métriques temps réel, interface intuitive.
