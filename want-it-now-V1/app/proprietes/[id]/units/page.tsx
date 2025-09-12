'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  AlertCircle,
  Building2,
  Grid3x3,
  List,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Home,
  Users,
  Euro,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { getPropriete, getUnites } from '@/actions/proprietes'
import { formatCurrency, cn } from '@/lib/utils'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

interface Unite {
  id: string
  numero: string
  nom: string
  type: string
  surface_m2: number
  capacite_max: number
  loyer_mensuel: number
  charges_mensuelles?: number
  est_louee: boolean
  disponible: boolean
  statut: string
  created_at: string
  updated_at: string
}

export default function PropertyUnitsPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const [property, setProperty] = useState<ProprieteListItem | null>(null)
  const [units, setUnits] = useState<Unite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied'>('all')

  // Load property and units data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load property details
        const propertyResult = await getPropriete(propertyId)
        if (!propertyResult.success || !propertyResult.data) {
          setError(propertyResult.error || 'Propriété introuvable')
          return
        }

        setProperty(propertyResult.data)

        // Check if it's NOT a property with units
        if (!propertyResult.data.a_unites) {
          // Redirect to the single property detail page
          router.replace(`/proprietes/${propertyId}/detail`)
          return
        }

        // Load units
        const unitsResult = await getUnites(propertyId)
        if (unitsResult.success && unitsResult.data) {
          setUnits(unitsResult.data as Unite[])
        }

      } catch (error) {
        console.error('Error loading data:', error)
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [propertyId, router])

  // Filter units
  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          unit.numero.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
                          (filterStatus === 'available' && unit.disponible && !unit.est_louee) ||
                          (filterStatus === 'occupied' && unit.est_louee)
    
    return matchesSearch && matchesFilter
  })

  // Calculate statistics
  const stats = {
    totalUnits: units.length,
    occupiedUnits: units.filter(u => u.est_louee).length,
    availableUnits: units.filter(u => u.disponible && !u.est_louee).length,
    occupancyRate: units.length > 0 ? (units.filter(u => u.est_louee).length / units.length * 100) : 0,
    totalMonthlyRevenue: units.filter(u => u.est_louee).reduce((sum, u) => sum + (u.loyer_mensuel || 0), 0),
    potentialRevenue: units.reduce((sum, u) => sum + (u.loyer_mensuel || 0), 0),
    averageRent: units.length > 0 ? units.reduce((sum, u) => sum + (u.loyer_mensuel || 0), 0) / units.length : 0
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Propriété introuvable'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-500">
            <Link href="/proprietes" className="hover:text-gray-700">
              Propriétés
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{property.nom}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Unités</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.nom}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{property.ville}, {property.pays}</span>
                </div>
                <Badge variant="outline">
                  {property.type_libelle}
                </Badge>
                <Badge 
                  variant="outline"
                  className={cn(
                    property.statut === 'disponible' && 'bg-green-50 text-green-700 border-green-300'
                  )}
                >
                  {property.statut_libelle}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`/proprietes/${propertyId}/preview`, '_blank')}
                title="Aperçu public de la propriété"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Aperçu propriété
              </Button>
              <Link href={`/proprietes/${propertyId}/detail`}>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Vue détaillée
                </Button>
              </Link>
              <Link href={`/proprietes/${propertyId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </Link>
              <Link href={`/proprietes/${propertyId}/unites/new`}>
                <Button className="gradient-copper text-white" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une unité
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Unités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{stats.totalUnits}</span>
                <Building2 className="w-5 h-5 text-brand-copper" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Taux d'occupation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {stats.occupancyRate.toFixed(0)}%
                  </span>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <Progress value={stats.occupancyRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Revenus mensuels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {formatCurrency(stats.totalMonthlyRevenue)}
                </span>
                <Euro className="w-5 h-5 text-brand-copper" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Potentiel: {formatCurrency(stats.potentialRevenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Disponibilité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Louées</span>
                  <span className="font-semibold text-brand-green">{stats.occupiedUnits}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Disponibles</span>
                  <span className="font-semibold text-green-600">{stats.availableUnits}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">En maintenance</span>
                  <span className="font-semibold text-gray-500">
                    {stats.totalUnits - stats.occupiedUnits - stats.availableUnits}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Units Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Unités ({filteredUnits.length})
              </CardTitle>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>

                {/* Filter */}
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="available">Disponibles</SelectItem>
                    <SelectItem value="occupied">Louées</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="p-2"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="p-2"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredUnits.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune unité trouvée</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Modifiez vos critères de recherche'
                    : 'Commencez par ajouter des unités à cette propriété'}
                </p>
                {!searchQuery && filterStatus === 'all' && (
                  <Link href={`/proprietes/${propertyId}/unites/new`}>
                    <Button className="gradient-copper text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une unité
                    </Button>
                  </Link>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnits.map(unit => (
                  <Link 
                    key={unit.id} 
                    href={`/proprietes/${propertyId}/unites/${unit.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {unit.nom}
                            </h3>
                            <p className="text-sm text-gray-500">
                              N° {unit.numero}
                            </p>
                          </div>
                          <Badge 
                            variant={unit.est_louee ? 'default' : 'secondary'}
                            className={cn(
                              unit.est_louee 
                                ? 'bg-brand-green text-white' 
                                : 'bg-green-100 text-green-700'
                            )}
                          >
                            {unit.est_louee ? 'Louée' : 'Disponible'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Surface</span>
                            <p className="font-medium">{unit.surface_m2} m²</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Capacité</span>
                            <p className="font-medium">{unit.capacite_max} pers.</p>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">Loyer mensuel</span>
                            <span className="font-bold text-lg text-brand-copper">
                              {formatCurrency(unit.loyer_mensuel)}
                            </span>
                          </div>
                          {unit.charges_mensuelles && (
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-gray-500 text-xs">+ Charges</span>
                              <span className="text-sm">
                                {formatCurrency(unit.charges_mensuelles)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2">
                          <div className="flex items-center gap-2">
                            {unit.est_louee ? (
                              <div className="flex items-center gap-1 text-xs text-brand-green">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Actuellement louée</span>
                              </div>
                            ) : unit.disponible ? (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Disponible immédiatement</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>En préparation</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(`/proprietes/${propertyId}/unites/${unit.id}/preview`, '_blank');
                            }}
                            title="Aperçu public de l'unité"
                            className="h-7 w-7 p-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-2">
                {filteredUnits.map(unit => (
                  <Link 
                    key={unit.id}
                    href={`/proprietes/${propertyId}/unites/${unit.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-copper/10 rounded-lg flex items-center justify-center">
                          <Home className="w-6 h-6 text-brand-copper" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{unit.nom}</h3>
                          <p className="text-sm text-gray-500">N° {unit.numero}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Surface</p>
                          <p className="font-medium">{unit.surface_m2} m²</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Capacité</p>
                          <p className="font-medium">{unit.capacite_max} pers.</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Loyer</p>
                          <p className="font-bold text-brand-copper">
                            {formatCurrency(unit.loyer_mensuel)}
                          </p>
                        </div>
                        
                        <Badge 
                          variant={unit.est_louee ? 'default' : 'secondary'}
                          className={cn(
                            unit.est_louee 
                              ? 'bg-brand-green text-white' 
                              : 'bg-green-100 text-green-700'
                          )}
                        >
                          {unit.est_louee ? 'Louée' : 'Disponible'}
                        </Badge>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`/proprietes/${propertyId}/unites/${unit.id}/preview`, '_blank');
                          }}
                          title="Aperçu public de l'unité"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}