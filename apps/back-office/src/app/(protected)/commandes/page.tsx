import Link from 'next/link';

import { BarChart3, ArrowRight, ShoppingBag, Package } from 'lucide-react';

export default function CommandesAnalytiquePage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4">
            <BarChart3 className="h-7 w-7 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytique Commandes
          </h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Graphiques et analyses croisees ventes / achats — en construction
          </p>
        </div>

        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center mb-8">
          <BarChart3 className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Module analytique a venir
          </h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
            Cette page accueillera les graphiques d&apos;evolution du CA (ventes
            vs achats), les marges par canal, les tendances mensuelles, et les
            comparatifs periode par periode.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/ventes"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Dashboard Ventes
                </p>
                <p className="text-xs text-gray-500">
                  Consultations, commandes, expeditions
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link
            href="/commandes/fournisseurs"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Achats</p>
                <p className="text-xs text-gray-500">Commandes fournisseurs</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
