'use client';

import { useState, useEffect, useMemo } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { useToast } from '@verone/common';
import { useStockAlerts } from '@verone/stock';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Filter,
  Search,
  Download,
  Package,
  TrendingDown,
  Clock,
  Eye,
  RefreshCw,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  Zap,
  BarChart3,
} from 'lucide-react';

import { QuickPurchaseOrderModal } from '../../../components/business/quick-purchase-order-modal';
import { StockAlertCard } from '../../../components/business/stock-alert-card';

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertCategory = 'stock' | 'movement' | 'forecast' | 'system';

interface StockAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  productImageUrl?: string | null; // ✅ NOUVEAU - URL image principale produit
  currentStock?: number;
  minStock?: number;
  reorderPoint?: number;
  timestamp: string;
  acknowledged: boolean;
  // Tracking commandes brouillon
  is_in_draft: boolean;
  quantity_in_draft: number | null;
  draft_order_id: string | null;
  draft_order_number: string | null;
  action?: {
    label: string;
    handler: () => void;
  };
}

export default function StockAlertesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    acknowledged: false,
    limit: 100,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickPurchaseModal, setShowQuickPurchaseModal] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<{
    productId: string;
    shortageQuantity: number;
  } | null>(null);

  const {
    loading,
    alerts,
    fetchAlerts,
    criticalAlerts,
    warningAlerts,
    alertsInDraft,
    alertsNotInDraft,
    isProductInDraft,
    getQuantityInDraft,
  } = useStockAlerts();

  // Mapper les alertes du hook vers l'interface locale
  const mappedAlerts = useMemo<StockAlert[]>(() => {
    return alerts.map(alert => ({
      id: alert.id,
      severity: alert.severity,
      category: 'stock' as AlertCategory,
      title:
        alert.alert_type === 'out_of_stock'
          ? 'Rupture de stock'
          : alert.alert_type === 'low_stock'
            ? 'Stock faible'
            : 'Stock commandé sans disponibilité',
      message:
        alert.alert_type === 'out_of_stock'
          ? `${alert.product_name} est en rupture de stock`
          : alert.alert_type === 'low_stock'
            ? `${alert.product_name} approche du seuil minimum (${alert.stock_real}/${alert.min_stock})`
            : `${alert.product_name} : commandes clients sans stock (${alert.stock_forecasted_out} unités)`,
      productId: alert.product_id,
      productName: alert.product_name,
      productSku: alert.sku,
      productImageUrl: null,
      currentStock: alert.stock_real,
      minStock: alert.min_stock,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      // Champs tracking brouillon pour StockAlertCard
      is_in_draft: alert.is_in_draft,
      quantity_in_draft: alert.quantity_in_draft,
      draft_order_id: alert.draft_order_id,
      draft_order_number: alert.draft_order_number,
      action: !alert.is_in_draft
        ? {
            label: 'Commander',
            handler: () => {
              setSelectedProductForOrder({
                productId: alert.product_id,
                shortageQuantity: alert.shortage_quantity,
              });
              setShowQuickPurchaseModal(true);
            },
          }
        : undefined,
    }));
  }, [alerts]);

  // Statistiques des alertes
  const alertStats = useMemo(() => {
    const unacknowledged = mappedAlerts.filter(a => !a.acknowledged);
    return {
      total: mappedAlerts.length,
      unacknowledged: unacknowledged.length,
      critical: criticalAlerts.length,
      warning: warningAlerts.length,
      info: 0,
      inDraft: alertsInDraft.length,
    };
  }, [mappedAlerts, criticalAlerts, warningAlerts, alertsInDraft]);

  // ✅ AUTO-OPEN MODAL depuis notification (Phase 2.2)
  // Détecte ?product_id= dans URL et ouvre automatiquement le modal de commande
  useEffect(() => {
    const productId = searchParams.get('product_id');

    if (productId && alerts.length > 0) {
      // Chercher l'alerte correspondante dans les alertes du hook (pas mappedAlerts)
      const alert = alerts.find(a => a.product_id === productId);

      if (alert && !alert.is_in_draft) {
        // Auto-ouvrir le modal seulement si pas déjà en brouillon
        setSelectedProductForOrder({
          productId: alert.product_id,
          shortageQuantity: alert.shortage_quantity,
        });
        setShowQuickPurchaseModal(true);

        // Optionnel : Supprimer le paramètre de l'URL après ouverture
        // router.replace('/stocks/alertes', { scroll: false });
      }
    }
  }, [searchParams, alerts]);

  // Filtres appliqués
  const filteredAlerts = mappedAlerts.filter(alert => {
    if (filters.severity && alert.severity !== filters.severity) return false;
    if (filters.category && alert.category !== filters.category) return false;
    if (filters.acknowledged && !alert.acknowledged) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        alert.title.toLowerCase().includes(search) ||
        alert.message.toLowerCase().includes(search) ||
        alert.productName?.toLowerCase().includes(search) ||
        alert.productSku?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-black" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-300 text-red-600 bg-red-50';
      case 'warning':
        return 'border-gray-300 text-black bg-gray-50';
      case 'info':
        return 'border-blue-300 text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </ButtonV2>
              <div>
                <h1 className="text-3xl font-bold text-black">Alertes Stock</h1>
                <p className="text-gray-600 mt-1">
                  Surveillance temps réel et alertes automatiques
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ButtonV2
                variant="outline"
                onClick={() => fetchAlerts()}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Actualiser
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs Alertes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Alertes Actives
              </CardTitle>
              <Bell className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {alertStats.unacknowledged}
              </div>
              <p className="text-xs text-gray-600">
                sur {alertStats.total} total
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Critique
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {alertStats.critical}
              </div>
              <p className="text-xs text-gray-600">action immédiate requise</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avertissement
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {alertStats.warning}
              </div>
              <p className="text-xs text-gray-600">surveillance requise</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Information
              </CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {alertStats.info}
              </div>
              <p className="text-xs text-gray-600">informations système</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtres et recherche
              </span>
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                {showFilters ? 'Masquer' : 'Afficher'} filtres
              </ButtonV2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recherche globale */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher alertes, produits, SKU..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 border-black"
                  />
                </div>
              </div>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Sévérité</Label>
                  <Select
                    onValueChange={value =>
                      setFilters(prev => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Toutes les sévérités" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les sévérités</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                      <SelectItem value="warning">Avertissement</SelectItem>
                      <SelectItem value="info">Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    onValueChange={value =>
                      setFilters(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les catégories</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="movement">Mouvement</SelectItem>
                      <SelectItem value="forecast">Prévision</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>État</Label>
                  <Select
                    onValueChange={value =>
                      setFilters(prev => ({
                        ...prev,
                        acknowledged: value === 'true',
                      }))
                    }
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Toutes les alertes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les alertes</SelectItem>
                      <SelectItem value="false">Non acquittées</SelectItem>
                      <SelectItem value="true">Acquittées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <ButtonV2
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        severity: '',
                        category: '',
                        acknowledged: false,
                        limit: 100,
                      });
                      setSearchTerm('');
                    }}
                    className="w-full border-black text-black hover:bg-black hover:text-white"
                  >
                    Réinitialiser
                  </ButtonV2>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des alertes */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Alertes ({filteredAlerts.length})</span>
              {loading && (
                <Badge
                  variant="outline"
                  className="border-blue-300 text-blue-600"
                >
                  Actualisation...
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Surveillance automatique avec actions recommandées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucune alerte trouvée</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || filters.severity || filters.category
                    ? 'Essayez de modifier vos filtres'
                    : 'Tous les systèmes fonctionnent normalement'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map(alert => (
                  <StockAlertCard
                    key={alert.id}
                    alert={{
                      id: alert.id,
                      product_id: alert.productId || '',
                      product_name: alert.productName || '',
                      sku: alert.productSku || '',
                      stock_real: alert.currentStock || 0,
                      stock_forecasted_in: 0,
                      stock_forecasted_out: 0,
                      min_stock: alert.minStock || 0,
                      shortage_quantity: 0,
                      alert_type:
                        alert.title === 'Rupture de stock'
                          ? 'out_of_stock'
                          : alert.title === 'Stock faible'
                            ? 'low_stock'
                            : 'no_stock_but_ordered',
                      severity: alert.severity,
                      is_in_draft: alert.is_in_draft,
                      quantity_in_draft: alert.quantity_in_draft,
                      draft_order_id: alert.draft_order_id,
                      draft_order_number: alert.draft_order_number,
                      validated: false, // Legacy code - cette page utilise l'ancien format d'alertes
                      validated_at: null,
                    }}
                    onActionClick={() => {
                      if (alert.action) {
                        alert.action.handler();
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal commande rapide */}
      {selectedProductForOrder && (
        <QuickPurchaseOrderModal
          open={showQuickPurchaseModal}
          onClose={() => {
            setShowQuickPurchaseModal(false);
            setSelectedProductForOrder(null);
          }}
          productId={selectedProductForOrder.productId}
          shortageQuantity={selectedProductForOrder.shortageQuantity}
          onSuccess={() => {
            fetchAlerts(); // Rafraîchir les alertes
          }}
        />
      )}
    </div>
  );
}
