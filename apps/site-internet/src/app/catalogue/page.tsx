export default function CataloguePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Notre Catalogue</h1>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex gap-4">
          <select className="border rounded-lg px-4 py-2">
            <option>Toutes les catégories</option>
            <option>Salons</option>
            <option>Chambres</option>
            <option>Bureaux</option>
          </select>
          <select className="border rounded-lg px-4 py-2">
            <option>Trier par</option>
            <option>Prix croissant</option>
            <option>Prix décroissant</option>
            <option>Nouveautés</option>
          </select>
        </div>
      </div>

      {/* Grille produits */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="bg-gray-200 h-48"></div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Produit {i + 1}</h3>
              <p className="text-gray-600 text-sm mb-3">Catégorie</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">€XX.XX</span>
                <a href={`/produit/${i + 1}`} className="text-sm text-blue-600 hover:underline">
                  Voir détails
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
