export default function PanierPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Liste produits panier */}
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold mb-8">Mon Panier</h1>

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 flex gap-4">
              <div className="bg-gray-200 w-24 h-24 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Produit {i}</h3>
                <p className="text-gray-600 text-sm mb-2">Référence: REF-{i}</p>
                <div className="flex items-center gap-4">
                  <input type="number" defaultValue="1" min="1" className="border rounded px-3 py-1 w-16" />
                  <button className="text-red-600 hover:underline text-sm">Supprimer</button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">€XX.XX</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Résumé commande */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h2 className="text-xl font-bold mb-4">Récapitulatif</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-semibold">€XX.XX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Livraison</span>
              <span className="font-semibold">€XX.XX</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>€XX.XX</span>
            </div>
          </div>
          <a href="/checkout" className="block w-full bg-gray-900 text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-800">
            Passer commande
          </a>
        </div>
      </div>
    </div>
  );
}
