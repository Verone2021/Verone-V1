import React from 'react'
import {
  Package,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  TrendingDown,
  Eye,
  Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  minStock: number
  price: number
  status: 'En stock' | 'Stock faible' | 'Rupture'
  lastUpdate: string
}

const products: Product[] = [
  {
    id: '1',
    name: 'Canapé Milano 3 places',
    sku: 'CAN-MIL-003',
    category: 'Canapés',
    stock: 12,
    minStock: 5,
    price: 2450,
    status: 'En stock',
    lastUpdate: '2024-01-15'
  },
  {
    id: '2',
    name: 'Table Venetia en chêne',
    sku: 'TAB-VEN-CHE',
    category: 'Tables',
    stock: 3,
    minStock: 5,
    price: 1890,
    status: 'Stock faible',
    lastUpdate: '2024-01-14'
  },
  {
    id: '3',
    name: 'Lampe Florence',
    sku: 'LAM-FLO-DOR',
    category: 'Éclairage',
    stock: 0,
    minStock: 10,
    price: 320,
    status: 'Rupture',
    lastUpdate: '2024-01-13'
  },
  {
    id: '4',
    name: 'Fauteuil Roma cuir',
    sku: 'FAU-ROM-CUI',
    category: 'Fauteuils',
    stock: 8,
    minStock: 3,
    price: 1650,
    status: 'En stock',
    lastUpdate: '2024-01-12'
  }
]

function getStatusColor(status: Product['status']) {
  switch (status) {
    case 'En stock':
      return 'bg-green-100 text-green-800'
    case 'Stock faible':
      return 'bg-orange-100 text-orange-800'
    case 'Rupture':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusIcon(status: Product['status']) {
  switch (status) {
    case 'Stock faible':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    case 'Rupture':
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return null
  }
}

export default function StocksPage() {
  const lowStockCount = products.filter(p => p.status === 'Stock faible').length
  const outOfStockCount = products.filter(p => p.status === 'Rupture').length
  const totalProducts = products.length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Stocks</h1>
              <p className="text-gray-600">Gestion des stocks et inventaire</p>
            </div>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Ajouter produit</span>
          </Button>
        </div>
      </div>

      {/* Stock summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total produits</p>
              <p className="text-2xl font-bold text-black">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock faible</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ruptures</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
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
                placeholder="Rechercher par nom, SKU, catégorie..."
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

      {/* Products table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Produit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Catégorie</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Prix</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {getStatusIcon(product.status)}
                      <span className={`font-medium text-black ${getStatusIcon(product.status) ? 'ml-2' : ''}`}>
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-500 font-mono text-sm">{product.sku}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{product.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-medium text-black">{product.stock}</span>
                      <span className="text-gray-500 text-sm ml-1">(min: {product.minStock})</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-black">{product.price.toLocaleString()}€</span>
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
          Affichage de <span className="font-medium">1</span> à <span className="font-medium">{totalProducts}</span> sur{' '}
          <span className="font-medium">{totalProducts}</span> produits
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