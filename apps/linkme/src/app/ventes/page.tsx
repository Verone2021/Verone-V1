export default function VentesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mes Ventes</h1>
        <p className="text-gray-600">Toutes vos ventes et commandes clients</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-4">
          <select className="border rounded-lg px-4 py-2">
            <option>Toutes les périodes</option>
            <option>Ce mois</option>
            <option>Ce trimestre</option>
            <option>Cette année</option>
          </select>
          <select className="border rounded-lg px-4 py-2">
            <option>Tous les statuts</option>
            <option>En cours</option>
            <option>Livrée</option>
            <option>Annulée</option>
          </select>
        </div>
      </div>

      {/* Liste ventes */}
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">Commande #{2025000 + i}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">En cours</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Client {i + 1} • {new Date().toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">€X,XXX</div>
                <div className="text-sm text-green-600">Commission: €XX</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm text-gray-600">
                <strong>3 produits</strong> • Taux commission: X%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
