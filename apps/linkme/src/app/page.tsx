export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tableau de Bord</h1>
        <p className="text-gray-600">Bienvenue sur votre espace vendeur</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Commissions du mois</div>
          <div className="text-3xl font-bold">€X,XXX</div>
          <div className="text-sm text-green-600 mt-2">+XX% vs mois dernier</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Ventes du mois</div>
          <div className="text-3xl font-bold">XX</div>
          <div className="text-sm text-gray-600 mt-2">commandes</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">CA généré</div>
          <div className="text-3xl font-bold">€XX,XXX</div>
          <div className="text-sm text-gray-600 mt-2">ce mois</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Taux de commission</div>
          <div className="text-3xl font-bold">X%</div>
          <div className="text-sm text-gray-600 mt-2">moyen</div>
        </div>
      </div>

      {/* Dernières ventes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Dernières Ventes</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b">
              <div>
                <div className="font-medium">Commande #{2025000 + i}</div>
                <div className="text-sm text-gray-600">Client • {new Date().toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">€XXX.XX</div>
                <div className="text-sm text-green-600">Commission: €XX.XX</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
