export default function CommissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mes Commissions</h1>
        <p className="text-gray-600">Détail de toutes vos commissions</p>
      </div>

      {/* Résumé commissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Total année</div>
          <div className="text-3xl font-bold">€XX,XXX</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Mois en cours</div>
          <div className="text-3xl font-bold">€X,XXX</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">À percevoir</div>
          <div className="text-3xl font-bold text-green-600">€XXX</div>
        </div>
      </div>

      {/* Tableau commissions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Historique</h2>
          <select className="border rounded-lg px-4 py-2">
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Commande</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">CA</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Taux</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Commission</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date().toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">#{2025000 + i}</td>
                  <td className="px-4 py-3 text-sm">Client {i + 1}</td>
                  <td className="px-4 py-3 text-sm">€X,XXX</td>
                  <td className="px-4 py-3 text-sm">X%</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">€XX</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Payée</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
