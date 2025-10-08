'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe,
  ArrowLeft,
  Upload,
  Download,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  Euro,
  BarChart,
  ShoppingBag,
  Filter,
  Search,
  ExternalLink,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function GoogleMerchantPage() {
  const router = useRouter()
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Configuration Google Merchant (à récupérer depuis la DB)
  const merchantConfig = {
    merchant_id: '123456789',
    api_connected: true,
    country: 'FR',
    currency: 'EUR',
    language: 'fr',
    last_sync: '2025-01-23T14:30:00',
    auto_sync: true,
    sync_frequency: 'daily'
  }

  // Produits synchronisés (données temporaires)
  const syncedProducts = [
    {
      id: '1',
      sku: 'CHR-001',
      name: 'Chaise Scandinave Nordic',
      price: 150,
      status: 'approved',
      google_status: 'active',
      impressions: 1250,
      clicks: 45,
      conversions: 3
    },
    {
      id: '2',
      sku: 'TBL-002',
      name: 'Table en Chêne Massif',
      price: 890,
      status: 'approved',
      google_status: 'active',
      impressions: 890,
      clicks: 32,
      conversions: 2
    },
    {
      id: '3',
      sku: 'CNP-003',
      name: 'Canapé 3 Places Velours',
      price: 1890,
      status: 'pending',
      google_status: 'pending_review',
      impressions: 0,
      clicks: 0,
      conversions: 0
    }
  ]

  const handleSync = async () => {
    setSyncStatus('syncing')
    // Simulation de synchronisation
    setTimeout(() => {
      setSyncStatus('success')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }, 2000)
  }

  const handleExport = () => {
    // Export des produits sélectionnés vers Google Merchant
    console.log('Exporting products:', selectedProducts)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="border-green-300 text-green-600">Approuvé</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-gray-300 text-black">En attente</Badge>
      case 'rejected':
        return <Badge variant="outline" className="border-red-300 text-red-600">Rejeté</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Statistiques
  const stats = {
    totalProducts: syncedProducts.length,
    activeProducts: syncedProducts.filter(p => p.google_status === 'active').length,
    totalImpressions: syncedProducts.reduce((sum, p) => sum + p.impressions, 0),
    totalClicks: syncedProducts.reduce((sum, p) => sum + p.clicks, 0),
    totalConversions: syncedProducts.reduce((sum, p) => sum + p.conversions, 0),
    conversionRate: 4.2
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/canaux-vente')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-black flex items-center space-x-2">
                  <Globe className="h-8 w-8" />
                  <span>Google Merchant Center</span>
                </h1>
                <p className="text-gray-600 mt-1">Gérez votre catalogue produits sur Google Shopping</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
              <Button
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Synchroniser
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Alerte de statut */}
        {syncStatus === 'success' && (
          <Alert className="mb-6 border-green-300 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Synchronisation réussie</AlertTitle>
            <AlertDescription className="text-green-700">
              Vos produits ont été synchronisés avec Google Merchant Center
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black flex items-center justify-between">
              Configuration Google Merchant
              {merchantConfig.api_connected ? (
                <Badge variant="outline" className="border-green-300 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connecté
                </Badge>
              ) : (
                <Badge variant="outline" className="border-red-300 text-red-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Non connecté
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">ID Marchand</p>
                <p className="font-mono">{merchantConfig.merchant_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pays / Langue</p>
                <p className="font-medium">{merchantConfig.country} / {merchantConfig.language}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Devise</p>
                <p className="font-medium">{merchantConfig.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dernière synchro</p>
                <p className="font-medium">{formatDate(merchantConfig.last_sync)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits</p>
                  <p className="text-2xl font-bold text-black">{stats.totalProducts}</p>
                </div>
                <Package className="h-6 w-6 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Impressions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalImpressions.toLocaleString('fr-FR')}
                  </p>
                </div>
                <BarChart className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clics</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalClicks}</p>
                </div>
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold text-black">{stats.totalConversions}</p>
                </div>
                <Euro className="h-6 w-6 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux Conv.</p>
                  <p className="text-2xl font-bold text-green-600">{stats.conversionRate}%</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs pour produits et configuration */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Produits Synchronisés</TabsTrigger>
            <TabsTrigger value="add">Ajouter des Produits</TabsTrigger>
            <TabsTrigger value="settings">Paramètres Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-black">Produits sur Google Merchant</CardTitle>
                <CardDescription>Gérez les produits synchronisés avec Google Shopping</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtres */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-black"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 border-black">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table des produits */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut Google</TableHead>
                      <TableHead>Impressions</TableHead>
                      <TableHead>Clics</TableHead>
                      <TableHead>Conversions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>{product.impressions.toLocaleString('fr-FR')}</TableCell>
                        <TableCell>{product.clicks}</TableCell>
                        <TableCell>{product.conversions}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-black">Ajouter des Produits</CardTitle>
                <CardDescription>Sélectionnez les produits à exporter vers Google Merchant</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-blue-300 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    Sélectionnez les produits depuis votre catalogue pour les synchroniser avec Google Merchant Center.
                    Assurez-vous que tous les champs requis sont remplis (GTIN, images, descriptions).
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {selectedProducts.length} produits sélectionnés
                    </p>
                    <Button
                      className="bg-black hover:bg-gray-800 text-white"
                      onClick={handleExport}
                      disabled={selectedProducts.length === 0}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Exporter vers Google
                    </Button>
                  </div>

                  {/* TODO: Ajouter la sélection de produits depuis le catalogue */}
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Interface de sélection de produits</p>
                    <p className="text-sm text-gray-500">À implémenter avec le hook useProducts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-black">Paramètres du Feed</CardTitle>
                <CardDescription>Configurez les paramètres de synchronisation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">Fréquence de synchronisation</label>
                    <Select defaultValue={merchantConfig.sync_frequency}>
                      <SelectTrigger className="w-full mt-1 border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manuelle</SelectItem>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Format d'export</label>
                    <Select defaultValue="xml">
                      <SelectTrigger className="w-full mt-1 border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xml">XML (Google Shopping)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Synchronisation automatique activée
                    </p>
                    <Button
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      Enregistrer les paramètres
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}