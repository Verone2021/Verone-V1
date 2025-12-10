export default function CommissionsPage() {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold mb-1">Mes Commissions</h1>
        <p className="text-gray-600 text-sm">
          Détail de toutes vos commissions
        </p>
      </div>

      {/* Résumé commissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-xs text-gray-600 mb-1">Total année</div>
          <div className="text-xl font-bold">€XX,XXX</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-xs text-gray-600 mb-1">Mois en cours</div>
          <div className="text-xl font-bold">€X,XXX</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-xs text-gray-600 mb-1">À percevoir</div>
          <div className="text-xl font-bold text-green-600">€XXX</div>
        </div>
      </div>

      {/* Tableau commissions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold">Historique</h2>
          <select className="border rounded-lg px-3 py-1.5 text-sm">
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Commande
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Client
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                  CA
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Taux
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Commission
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium">
                    #{2025000 + i}
                  </td>
                  <td className="px-3 py-2 text-xs">Client {i + 1}</td>
                  <td className="px-3 py-2 text-xs">€X,XXX</td>
                  <td className="px-3 py-2 text-xs">X%</td>
                  <td className="px-3 py-2 text-xs font-semibold text-green-600">
                    €XX
                  </td>
                  <td className="px-3 py-2">
                    <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded">
                      Payée
                    </span>
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
