export default function VentesPage() {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold mb-1">Mes Ventes</h1>
        <p className="text-gray-600 text-sm">
          Toutes vos ventes et commandes clients
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <div className="flex gap-3">
          <select className="border rounded-lg px-3 py-1.5 text-sm">
            <option>Toutes les périodes</option>
            <option>Ce mois</option>
            <option>Ce trimestre</option>
            <option>Cette année</option>
          </select>
          <select className="border rounded-lg px-3 py-1.5 text-sm">
            <option>Tous les statuts</option>
            <option>En cours</option>
            <option>Livrée</option>
            <option>Annulée</option>
          </select>
        </div>
      </div>

      {/* Liste ventes */}
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    Commande #{2025000 + i}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded">
                    En cours
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Client {i + 1} • {new Date().toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold">€X,XXX</div>
                <div className="text-xs text-green-600">Commission: €XX</div>
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="text-xs text-gray-600">
                <strong>3 produits</strong> • Taux commission: X%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
