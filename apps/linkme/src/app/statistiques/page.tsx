export default function StatistiquesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Statistiques & Performance</h1>
        <p className="text-gray-600">Analysez vos performances de vente</p>
      </div>

      {/* KPIs Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-sm mb-2 opacity-90">CA Total 2025</div>
          <div className="text-3xl font-bold">€XX,XXX</div>
          <div className="text-sm mt-2 opacity-75">+XX% vs 2024</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-sm mb-2 opacity-90">Commissions 2025</div>
          <div className="text-3xl font-bold">€X,XXX</div>
          <div className="text-sm mt-2 opacity-75">Taux moyen: X%</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-sm mb-2 opacity-90">Ventes Mois</div>
          <div className="text-3xl font-bold">XX</div>
          <div className="text-sm mt-2 opacity-75">commandes</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-sm mb-2 opacity-90">Panier Moyen</div>
          <div className="text-3xl font-bold">€XXX</div>
          <div className="text-sm mt-2 opacity-75">+X% ce mois</div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA mensuel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">CA Mensuel</h2>
          <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Graphique CA mensuel</span>
          </div>
        </div>

        {/* Commissions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Évolution Commissions</h2>
          <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Graphique commissions</span>
          </div>
        </div>
      </div>

      {/* Top produits */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Top 5 Produits Vendus</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b">
              <div>
                <div className="font-medium">Produit {i + 1}</div>
                <div className="text-sm text-gray-600">XX ventes</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">€X,XXX</div>
                <div className="text-sm text-green-600">€XXX commissions</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
