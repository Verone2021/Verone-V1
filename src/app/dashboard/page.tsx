import React from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change: string
  isPositive: boolean
  icon: React.ReactNode
}

function StatCard({ title, value, change, isPositive, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-black">{value}</p>
          <div className="flex items-center mt-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm ml-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </span>
          </div>
        </div>
        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const stats = [
    {
      title: 'Commandes en cours',
      value: '24',
      change: '+12%',
      isPositive: true,
      icon: <ShoppingCart className="h-6 w-6 text-gray-600" />
    },
    {
      title: 'Produits en stock',
      value: '1,247',
      change: '-3%',
      isPositive: false,
      icon: <Package className="h-6 w-6 text-gray-600" />
    },
    {
      title: 'Clients actifs',
      value: '89',
      change: '+8%',
      isPositive: true,
      icon: <Users className="h-6 w-6 text-gray-600" />
    },
    {
      title: 'Activité du jour',
      value: '156',
      change: '+24%',
      isPositive: true,
      icon: <Activity className="h-6 w-6 text-gray-600" />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <LayoutDashboard className="h-8 w-8 text-black" />
          <div>
            <h1 className="text-2xl font-bold text-black">Dashboard</h1>
            <p className="text-gray-600">Vue d'ensemble de votre activité Vérone</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Commandes récentes</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-black">Commande #000{item}</p>
                  <p className="text-sm text-gray-500">Client Exemple {item}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-black">{(Math.random() * 1000 + 500).toFixed(0)}€</p>
                  <p className="text-sm text-gray-500">En cours</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Alertes stock</h3>
          <div className="space-y-3">
            {[
              { name: 'Canapé Milano', stock: 2, status: 'Faible' },
              { name: 'Table Venetia', stock: 0, status: 'Rupture' },
              { name: 'Lampe Florence', stock: 1, status: 'Critique' },
              { name: 'Fauteuil Roma', stock: 3, status: 'Attention' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-black">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.stock} en stock</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'Rupture'
                    ? 'bg-red-100 text-red-800'
                    : item.status === 'Critique'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}