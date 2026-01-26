export default function CheckoutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Finaliser ma commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire */}
        <div className="space-y-6">
          {/* Informations client */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Informations de livraison
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Prénom"
                  className="border rounded-lg px-4 py-2"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  className="border rounded-lg px-4 py-2"
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                className="border rounded-lg px-4 py-2 w-full"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                className="border rounded-lg px-4 py-2 w-full"
              />
              <input
                type="text"
                placeholder="Adresse"
                className="border rounded-lg px-4 py-2 w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Code postal"
                  className="border rounded-lg px-4 py-2"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  className="border rounded-lg px-4 py-2"
                />
              </div>
            </form>
          </div>

          {/* Paiement */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Paiement</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Numéro de carte"
                className="border rounded-lg px-4 py-2 w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="MM/AA"
                  className="border rounded-lg px-4 py-2"
                />
                <input
                  type="text"
                  placeholder="CVC"
                  className="border rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">
              Récapitulatif commande
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Articles</span>
                <span>€XX.XX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Livraison</span>
                <span>€XX.XX</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total à payer</span>
                <span>€XX.XX</span>
              </div>
            </div>
            <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800">
              Confirmer et payer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
