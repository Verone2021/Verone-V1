export default function ComptePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Mon Compte</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu compte */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <nav className="space-y-2">
              <a href="#" className="block px-4 py-2 bg-gray-100 rounded-lg font-semibold">Informations personnelles</a>
              <a href="#" className="block px-4 py-2 hover:bg-gray-50 rounded-lg">Mes commandes</a>
              <a href="#" className="block px-4 py-2 hover:bg-gray-50 rounded-lg">Mes adresses</a>
              <a href="#" className="block px-4 py-2 hover:bg-gray-50 rounded-lg">Mes favoris</a>
              <a href="#" className="block px-4 py-2 text-red-600 hover:bg-gray-50 rounded-lg">Déconnexion</a>
            </nav>
          </div>
        </div>

        {/* Contenu compte */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Informations personnelles</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom</label>
                  <input type="text" className="border rounded-lg px-4 py-2 w-full" defaultValue="Jean" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <input type="text" className="border rounded-lg px-4 py-2 w-full" defaultValue="Dupont" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" className="border rounded-lg px-4 py-2 w-full" defaultValue="jean.dupont@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <input type="tel" className="border rounded-lg px-4 py-2 w-full" defaultValue="+33 6 12 34 56 78" />
              </div>
              <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800">
                Enregistrer les modifications
              </button>
            </form>
          </div>

          {/* Dernières commandes */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-6">Mes dernières commandes</h2>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">Commande #{2025000 + i}</div>
                      <div className="text-sm text-gray-600">Passée le {new Date().toLocaleDateString()}</div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Livrée</span>
                  </div>
                  <div className="text-sm text-gray-600">2 articles • Total: €XX.XX</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
