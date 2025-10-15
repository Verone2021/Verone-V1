"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Package,
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Building,
  User,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SourcingEchantillonsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Données mock pour les commandes d'échantillons
  const sampleOrders = [
    {
      id: 1,
      order_number: 'ECH-2025-001',
      product_title: 'Canapé 3 places tissu',
      supplier: 'Mobilier Design Pro',
      client: 'Sophie Durand',
      status: 'ordered',
      order_date: '2025-01-15',
      expected_delivery: '2025-01-25',
      samples: [
        { id: 1, type: 'Tissu principal', color: 'Beige chiné', size: '20x20cm' },
        { id: 2, type: 'Tissu coussins', color: 'Gris anthracite', size: '20x20cm' }
      ],
      budget: '45€',
      notes: 'Échantillons pour validation couleur'
    },
    {
      id: 2,
      order_number: 'ECH-2025-002',
      product_title: 'Table en chêne massif',
      supplier: 'Bois & Traditions',
      client: 'Pierre Martin',
      status: 'delivered',
      order_date: '2025-01-10',
      delivery_date: '2025-01-18',
      samples: [
        { id: 3, type: 'Essence bois', color: 'Chêne naturel', size: '15x10x2cm' },
        { id: 4, type: 'Finition', color: 'Vernis mat', size: '15x10x2cm' }
      ],
      budget: '35€',
      notes: 'Client validé - passage commande possible'
    },
    {
      id: 3,
      order_number: 'ECH-2025-003',
      product_title: 'Suspension design moderne',
      supplier: 'Éclairage Innovation',
      client: 'Interne - Catalogue',
      status: 'pending',
      order_date: '2025-01-16',
      expected_delivery: '2025-01-30',
      samples: [
        { id: 5, type: 'Matériau principal', color: 'Métal brossé', size: 'Ø 15cm' }
      ],
      budget: '25€',
      notes: 'Pour validation gamme premium'
    },
    {
      id: 4,
      order_number: 'ECH-2025-004',
      product_title: 'Chaise vintage scandinave',
      supplier: 'Nordic Furniture',
      client: 'Marie Leclerc',
      status: 'in_transit',
      order_date: '2025-01-12',
      expected_delivery: '2025-01-22',
      samples: [
        { id: 6, type: 'Bois siège', color: 'Hêtre naturel', size: '10x10x5cm' },
        { id: 7, type: 'Tissu coussin', color: 'Lin beige', size: '20x20cm' }
      ],
      budget: '40€',
      notes: 'Livraison en cours - Colissimo'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-gray-300 text-gray-600">En attente</Badge>
      case 'ordered':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">Commandé</Badge>
      case 'in_transit':
        return <Badge variant="outline" className="border-gray-300 text-black">En transit</Badge>
      case 'delivered':
        return <Badge variant="outline" className="border-green-300 text-green-600">Livré</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />
      case 'ordered':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'in_transit':
        return <Truck className="h-4 w-4 text-black" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredOrders = sampleOrders.filter(order => {
    const matchesSearch = order.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Échantillons</h1>
              <p className="text-gray-600 mt-1">Commandes et suivi des échantillons produits</p>
            </div>
            <div className="flex items-center space-x-3">
              <ButtonV2
                variant="outline"
                onClick={() => router.push('/sourcing')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Retour Dashboard
              </ButtonV2>
              <ButtonV2
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Échantillon
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Commandes</CardTitle>
              <Package className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{sampleOrders.length}</div>
              <p className="text-xs text-gray-600">échantillons commandés</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Cours</CardTitle>
              <Truck className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sampleOrders.filter(o => ['ordered', 'in_transit'].includes(o.status)).length}
              </div>
              <p className="text-xs text-gray-600">commandes en transit</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Livrés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sampleOrders.filter(o => o.status === 'delivered').length}
              </div>
              <p className="text-xs text-gray-600">prêts pour validation</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Budget Total</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">145€</div>
              <p className="text-xs text-gray-600">ce mois-ci</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black">Filtres et Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par produit, fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-black focus:ring-black"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="ordered">Commandé</SelectItem>
                  <SelectItem value="in_transit">En transit</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                </SelectContent>
              </Select>

              <ButtonV2
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Exporter
              </ButtonV2>
            </div>
          </CardContent>
        </Card>

        {/* Liste des commandes d'échantillons */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Commandes d'Échantillons ({filteredOrders.length})</CardTitle>
            <CardDescription>Suivi complet des échantillons commandés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  {/* En-tête commande */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-semibold text-black">{order.order_number}</h3>
                        <p className="text-sm text-gray-600">{order.product_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(order.status)}
                      <ButtonV2 variant="outline" size="sm" className="border-gray-300">
                        <MoreHorizontal className="h-4 w-4" />
                      </ButtonV2>
                    </div>
                  </div>

                  {/* Informations principales */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Fournisseur:</span>
                      <span className="font-medium text-black">{order.supplier}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium text-black">{order.client}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium text-black">{order.budget}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Commandé le:</span>
                      <span className="text-black">{order.order_date}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {order.status === 'delivered' ? 'Livré le:' : 'Livraison prévue:'}
                      </span>
                      <span className="text-black">
                        {order.status === 'delivered' ? order.delivery_date : order.expected_delivery}
                      </span>
                    </div>
                  </div>

                  {/* Liste des échantillons */}
                  <div className="mb-4">
                    <h4 className="font-medium text-black mb-2">Échantillons commandés:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.samples.map((sample) => (
                        <div key={sample.id} className="flex items-center justify-between p-2 bg-gray-100 rounded text-sm">
                          <div>
                            <span className="font-medium text-black">{sample.type}</span>
                            <span className="text-gray-600 ml-2">({sample.color})</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{sample.size}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Notes:</strong> {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      {order.samples.length} échantillon{order.samples.length > 1 ? 's' : ''}
                    </div>
                    <div className="flex space-x-2">
                      <ButtonV2 variant="outline" size="sm" className="border-gray-300">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </ButtonV2>
                      {order.status === 'delivered' && (
                        <ButtonV2 size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Valider échantillons
                        </ButtonV2>
                      )}
                      {order.status === 'in_transit' && (
                        <ButtonV2 variant="outline" size="sm" className="border-blue-300 text-blue-600">
                          <Truck className="h-4 w-4 mr-2" />
                          Suivre livraison
                        </ButtonV2>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune commande d'échantillon trouvée</p>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}