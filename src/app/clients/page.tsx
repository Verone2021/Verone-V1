import React from 'react'
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  city: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  status: 'Actif' | 'Inactif'
}

const clients: Client[] = [
  {
    id: '1',
    name: 'Marie Dubois',
    email: 'marie.dubois@email.com',
    phone: '06 12 34 56 78',
    city: 'Paris',
    totalOrders: 12,
    totalSpent: 15420,
    lastOrder: '2024-01-15',
    status: 'Actif'
  },
  {
    id: '2',
    name: 'Pierre Martin',
    email: 'pierre.martin@email.com',
    phone: '06 23 45 67 89',
    city: 'Lyon',
    totalOrders: 8,
    totalSpent: 9850,
    lastOrder: '2024-01-10',
    status: 'Actif'
  },
  {
    id: '3',
    name: 'Sophie Laurent',
    email: 'sophie.laurent@email.com',
    phone: '06 34 56 78 90',
    city: 'Marseille',
    totalOrders: 5,
    totalSpent: 6200,
    lastOrder: '2023-12-20',
    status: 'Inactif'
  },
  {
    id: '4',
    name: 'Thomas Leroy',
    email: 'thomas.leroy@email.com',
    phone: '06 45 67 89 01',
    city: 'Nice',
    totalOrders: 15,
    totalSpent: 22100,
    lastOrder: '2024-01-12',
    status: 'Actif'
  }
]

function getStatusColor(status: Client['status']) {
  switch (status) {
    case 'Actif':
      return 'bg-green-100 text-green-800'
    case 'Inactif':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function ClientsPage() {
  const activeClients = clients.filter(c => c.status === 'Actif').length
  const totalClients = clients.length
  const avgSpent = clients.reduce((sum, client) => sum + client.totalSpent, 0) / clients.length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Clients</h1>
              <p className="text-gray-600">Gestion de la clientèle</p>
            </div>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouveau client</span>
          </Button>
        </div>
      </div>

      {/* Client summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total clients</p>
              <p className="text-2xl font-bold text-black">{totalClients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clients actifs</p>
              <p className="text-2xl font-bold text-green-600">{activeClients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold">€</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Panier moyen</p>
              <p className="text-2xl font-bold text-black">{Math.round(avgSpent).toLocaleString()}€</p>
            </div>
          </div>
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
                placeholder="Rechercher par nom, email, téléphone..."
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

      {/* Clients table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Localisation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Commandes</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Total dépensé</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-medium text-black">{client.name}</span>
                      <p className="text-sm text-gray-500">
                        Dernière commande: {new Date(client.lastOrder).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {client.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {client.city}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-black">{client.totalOrders}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-black">{client.totalSpent.toLocaleString()}€</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
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
          Affichage de <span className="font-medium">1</span> à <span className="font-medium">{totalClients}</span> sur{' '}
          <span className="font-medium">{totalClients}</span> clients
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