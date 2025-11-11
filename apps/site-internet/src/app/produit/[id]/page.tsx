export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ FIX P0: Next.js 15 async params requirement
  const { id } = await params;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Images produit */}
      <div>
        <div className="bg-gray-200 h-96 rounded-lg mb-4" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 h-20 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Détails produit */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Nom du Produit</h1>
        <div className="text-2xl font-bold text-gray-900 mb-6">€XX.XX</div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-600">
            Description détaillée du produit. Dimensions, matériaux,
            caractéristiques...
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Caractéristiques</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Caractéristique 1</li>
            <li>Caractéristique 2</li>
            <li>Caractéristique 3</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quantité</label>
            <input
              type="number"
              defaultValue="1"
              min="1"
              className="border rounded-lg px-4 py-2 w-24"
            />
          </div>
          <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800">
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
