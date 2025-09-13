import React from 'react'
import {
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Order {
  id: string
  number: string
  client: string
  date: string
  status: 'En cours' | 'Expédiée' | 'Livrée' | 'Annulée'
  total: number
  items: number
}

const orders: Order[] = [
  {
    id: '1',
    number: 'CMD-001',
    client: 'Marie Dubois',
    date: '2024-01-15',
    status: 'En cours',
    total: 2450,
    items: 3
  },
  {
    id: '2',
    number: 'CMD-002',
    client: 'Pierre Martin',
    date: '2024-01-14',
    status: 'Expédiée',
    total: 1890,
    items: 2
  },
  {
    id: '3',
    number: 'CMD-003',
    client: 'Sophie Laurent',
    date: '2024-01-13',
    status: 'Livrée',
    total: 3200,
    items: 5
  },
  {
    id: '4',
    number: 'CMD-004',
    client: 'Thomas Leroy',
    date: '2024-01-12',
    status: 'En cours',
    total: 1650,
    items: 2
  }
]

function getStatusColor(status: Order['status']) {
  switch (status) {
    case 'En cours':
      return 'bg-blue-100 text-blue-800'
    case 'Expédiée':
      return 'bg-orange-100 text-orange-800'
    case 'Livrée':
      return 'bg-green-100 text-green-800'
    case 'Annulée':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function CommandesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Commandes</h1>
              <p className="text-gray-600">Gestion des commandes clients</p>
            </div>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouvelle commande</span>
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher par numéro, client..."
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
          </Button>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Numéro</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Articles</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-black">{order.number}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{order.client}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-500">
                      {new Date(order.date).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{order.items} articles</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-black">{order.total.toLocaleString()}€</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Affichage de <span className="font-medium">1</span> à <span className="font-medium">4</span> sur{' '}
          <span className="font-medium">4</span> commandes
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Précédent
          </Button>
          <Button variant="outline" size="sm" disabled>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}