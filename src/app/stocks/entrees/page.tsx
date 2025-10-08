"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownToLine,
  ArrowLeft,
  Plus,
  Filter,
  Search,
  Download,
  Package,
  TrendingUp,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { StockMovementModal } from '../../../components/business/stock-movement-modal'
import { useStockOptimized } from '../../../hooks/use-stock-optimized'
import { useToast } from '../../../hooks/use-toast'

export default function StockEntreesPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Filtres pour mouvements d'entrée uniquement
  const [filters, setFilters] = useState({
    movementTypes: ['IN'],
    dateFrom: '',
    dateTo: '',
    performedBy: '',
    reasonCodes: [],
    limit: 50,
    offset: 0
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showEntryModal, setShowEntryModal] = useState(false)

  const {
    stockSummary,
    movements,
    loading,
    error,
    stats,
    createMovement,
    refetch
  } = useStockOptimized(filters)

  // Filtrer pour les entrées uniquement
  const entryMovements = movements.filter(m => m.movement_type === 'IN')

  // KPIs spécifiques aux entrées
  const entryStats = {
    totalEntries: entryMovements.length,
    totalQuantity: entryMovements.reduce((sum, m) => sum + Math.abs(m.quantity_change), 0),
    todayEntries: entryMovements.filter(m =>
      new Date(m.performed_at).toDateString() === new Date().toDateString()
    ).length,
    avgEntrySize: entryMovements.length > 0 ?
      Math.round(entryMovements.reduce((sum, m) => sum + Math.abs(m.quantity_change), 0) / entryMovements.length) : 0
  }

  // Gestionnaire nouvelle entrée rapide
  const handleQuickEntry = async (data: {
    product_id: string
    quantity_change: number
    reason_code: string
    notes?: string
  }) => {
    const success = await createMovement({
      ...data,
      movement_type: 'IN'
    })

    if (success) {
      setShowEntryModal(false)
      refetch()
    }
  }

  // Mise à jour des filtres
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }))
  }

  // Export CSV des entrées
  const handleExport = () => {
    const csvData = entryMovements.map(m => ({
      Date: new Date(m.performed_at).toLocaleDateString('fr-FR'),
      Produit: m.product_name || 'Produit inconnu',
      SKU: m.product_sku || '',
      Quantité: m.quantity_change,
      'Stock avant': m.quantity_before,
      'Stock après': m.quantity_after,
      Motif: m.reason_code || '',
      Notes: m.notes || '',
      'Effectué par': m.performer_name || 'Système'
    }))

    // Logique export CSV (simplifiée)
    console.log('Export CSV:', csvData)
    toast({
      title: "Export réussi",
      description: `${csvData.length} entrées exportées`
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-black">Entrées de Stock</h1>
                <p className="text-gray-600 mt-1">
                  Gestion des mouvements d'entrée et réceptions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                onClick={() => setShowEntryModal(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Entrée
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs Entrées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Entrées Totales</CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{entryStats.totalEntries}</div>
              <p className="text-xs text-gray-600">
                {entryStats.totalQuantity} unités reçues
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{entryStats.todayEntries}</div>
              <p className="text-xs text-gray-600">
                entrées effectuées
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taille Moyenne</CardTitle>
              <Package className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{entryStats.avgEntrySize}</div>
              <p className="text-xs text-gray-600">
                unités par entrée
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.movements_week > 0 ? '+' : ''}{stats.movements_week}
              </div>
              <p className="text-xs text-gray-600">
                cette semaine
              </p>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                {showFilters ? 'Masquer' : 'Afficher'} filtres
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recherche globale */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher produit, SKU, notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-black"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleExport}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Date début</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motif d'entrée</Label>
                  <Select onValueChange={(value) => handleFilterChange('reasonCodes', value ? [value] : [])}>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Tous les motifs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les motifs</SelectItem>
                      <SelectItem value="purchase_reception">Réception commande</SelectItem>
                      <SelectItem value="return_from_client">Retour client</SelectItem>
                      <SelectItem value="found_inventory">Inventaire trouvaille</SelectItem>
                      <SelectItem value="manual_adjustment">Ajustement manuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        movementTypes: ['IN'],
                        dateFrom: '',
                        dateTo: '',
                        performedBy: '',
                        reasonCodes: [],
                        limit: 50,
                        offset: 0
                      })
                      setSearchTerm('')
                    }}
                    className="w-full border-black text-black hover:bg-black hover:text-white"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des entrées */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mouvements d'Entrée ({entryMovements.length})</span>
              {loading && (
                <Badge variant="outline" className="border-blue-300 text-blue-600">
                  Chargement...
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Historique des entrées de stock avec détails complets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            ) : entryMovements.length === 0 ? (
              <div className="text-center py-8">
                <ArrowDownToLine className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucune entrée de stock trouvée</p>
                <Button
                  onClick={() => setShowEntryModal(true)}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première entrée
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {entryMovements
                  .filter(movement => {
                    if (!searchTerm) return true
                    const search = searchTerm.toLowerCase()
                    return (
                      movement.product_name?.toLowerCase().includes(search) ||
                      movement.product_sku?.toLowerCase().includes(search) ||
                      movement.notes?.toLowerCase().includes(search) ||
                      movement.reason_code?.toLowerCase().includes(search)
                    )
                  })
                  .map((movement) => (
                    <div
                      key={movement.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-black">
                              {movement.product_name || 'Produit inconnu'}
                            </h3>
                            {movement.product_sku && (
                              <Badge variant="outline" className="text-xs">
                                {movement.product_sku}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="border-green-300 text-green-600"
                            >
                              <ArrowDownToLine className="h-3 w-3 mr-1" />
                              +{movement.quantity_change}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Stock avant:</span> {movement.quantity_before}
                            </div>
                            <div>
                              <span className="font-medium">Stock après:</span> {movement.quantity_after}
                            </div>
                            <div>
                              <span className="font-medium">Motif:</span> {movement.reason_code || 'Non spécifié'}
                            </div>
                            <div>
                              <span className="font-medium">Par:</span> {movement.performer_name || 'Système'}
                            </div>
                          </div>

                          {movement.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              {movement.notes}
                            </p>
                          )}

                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(movement.performed_at).toLocaleString('fr-FR')}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-black"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal nouvelle entrée */}
      {showEntryModal && (
        <StockMovementModal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          onSubmit={handleQuickEntry}
          movementType="IN"
          title="Nouvelle Entrée de Stock"
        />
      )}
    </div>
  )
}