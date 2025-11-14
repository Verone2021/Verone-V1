export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-12 text-center">
        <h2 className="text-4xl font-bold mb-4">Mobilier Haut de Gamme</h2>
        <p className="text-xl mb-8">
          Découvrez notre collection exclusive de meubles et décoration
          d'intérieur
        </p>
        <a
          href="/catalogue"
          className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
        >
          Découvrir la Collection
        </a>
      </section>

      {/* Produits Vedettes */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Produits Vedettes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="bg-gray-200 h-48 rounded-lg mb-4" />
              <h4 className="text-lg font-semibold mb-2">Produit {i}</h4>
              <p className="text-gray-600 mb-4">Description du produit...</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">€XX.XX</span>
                <button className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                  Ajouter au panier
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
