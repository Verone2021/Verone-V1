import { Clock, Home, MapPin, Phone, Truck } from 'lucide-react';

export default function LivraisonPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-verone-black mb-4">
          Livraison
        </h1>
        <p className="text-verone-gray-500 max-w-2xl mx-auto leading-relaxed">
          Un service de livraison premium adapté au mobilier haut de gamme
        </p>
      </div>

      <div className="space-y-12">
        {/* Delivery types */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
            Modes de livraison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-verone-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Truck className="h-5 w-5 text-verone-black" />
                <h3 className="font-semibold text-verone-black">
                  Livraison standard
                </h3>
              </div>
              <p className="text-sm text-verone-gray-600 leading-relaxed mb-3">
                Livraison au pied de l&apos;immeuble ou devant la maison. Idéale
                pour les articles de décoration et le petit mobilier.
              </p>
              <p className="text-sm font-medium text-verone-black">
                49 &euro; &mdash; Offerte dès 500 &euro; d&apos;achat
              </p>
            </div>
            <div className="border border-verone-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Home className="h-5 w-5 text-verone-black" />
                <h3 className="font-semibold text-verone-black">
                  Livraison à domicile avec montage
                </h3>
              </div>
              <p className="text-sm text-verone-gray-600 leading-relaxed mb-3">
                Livraison dans la pièce de votre choix avec montage
                professionnel. Recommandée pour le mobilier volumineux.
              </p>
              <p className="text-sm font-medium text-verone-black">
                Tarif selon article (indiqué sur la fiche produit)
              </p>
            </div>
          </div>
        </section>

        {/* Delays */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
            Délais de livraison
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-verone-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-verone-black">
                  Articles en stock
                </p>
                <p className="text-sm text-verone-gray-600">
                  Expédition sous 3 à 5 jours ouvrés
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-verone-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-verone-black">
                  Articles sur commande
                </p>
                <p className="text-sm text-verone-gray-600">
                  2 à 8 semaines selon le fabricant (délai précisé sur chaque
                  fiche produit)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-verone-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-verone-black">
                  Pièces sur mesure
                </p>
                <p className="text-sm text-verone-gray-600">
                  4 à 12 semaines selon la complexité de la fabrication
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Zones */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
            Zones de livraison
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-verone-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-verone-black">
                  France métropolitaine
                </p>
                <p className="text-sm text-verone-gray-600">
                  Livraison disponible sur l&apos;ensemble du territoire
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-verone-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-verone-black">
                  Corse et DOM-TOM
                </p>
                <p className="text-sm text-verone-gray-600">
                  Nous consulter pour un devis personnalisé
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tracking */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-4">
            Suivi de commande
          </h2>
          <p className="text-sm text-verone-gray-600 leading-relaxed mb-4">
            Dès l&apos;expédition de votre commande, vous recevez un email avec
            un numéro de suivi. Pour le mobilier livré à domicile, notre
            transporteur vous contacte directement pour convenir d&apos;un
            rendez-vous de livraison.
          </p>
          <div className="flex items-center gap-3 bg-verone-gray-50 rounded-lg p-4">
            <Phone className="h-5 w-5 text-verone-gray-400" />
            <p className="text-sm text-verone-gray-600">
              Service client :{' '}
              <span className="font-medium">+33 1 23 45 67 89</span> (lun-ven
              9h-18h)
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
