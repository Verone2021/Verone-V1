import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowLeftRight, CheckCircle, Clock, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Retours et échanges',
  description:
    'Politique de retour Vérone : 30 jours pour retourner vos articles. Procédure simple et remboursement rapide.',
  alternates: { canonical: '/retours' },
};

export default function RetoursPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-verone-black mb-4">
          Retours et échanges
        </h1>
        <p className="text-verone-gray-500 max-w-2xl mx-auto leading-relaxed">
          Votre satisfaction est notre priorité
        </p>
      </div>

      <div className="space-y-12">
        {/* Policy */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-4">
            Notre politique de retour
          </h2>
          <p className="text-sm text-verone-gray-600 leading-relaxed">
            Conformément à la législation française sur la vente à distance,
            vous disposez d&apos;un délai de 14 jours à compter de la réception
            de votre commande pour exercer votre droit de rétractation. Chez
            Vérone, nous étendons ce délai à 30 jours pour vous permettre de
            découvrir sereinement vos nouvelles pièces dans votre intérieur.
          </p>
        </section>

        {/* Conditions */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
            Conditions de retour
          </h2>
          <div className="space-y-3">
            {[
              "L'article doit être dans son état d'origine, non utilisé et dans son emballage d'origine",
              'Les articles sur mesure ou personnalisés ne sont pas éligibles au retour',
              'Les frais de retour sont à la charge du client (sauf article défectueux)',
              "Le remboursement est effectué sous 14 jours après réception et vérification de l'article",
            ].map((condition, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-verone-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-verone-gray-600">{condition}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Procedure */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
            Procédure de retour
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-verone-gray-200 rounded-lg p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-verone-gray-100 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-5 w-5 text-verone-gray-600" />
              </div>
              <h3 className="font-medium text-verone-black mb-2">
                1. Contactez-nous
              </h3>
              <p className="text-xs text-verone-gray-500">
                Envoyez un email à contact@verone.fr avec votre numéro de
                commande et le motif du retour.
              </p>
            </div>
            <div className="border border-verone-gray-200 rounded-lg p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-verone-gray-100 flex items-center justify-center mx-auto mb-3">
                <ArrowLeftRight className="h-5 w-5 text-verone-gray-600" />
              </div>
              <h3 className="font-medium text-verone-black mb-2">
                2. Préparez le colis
              </h3>
              <p className="text-xs text-verone-gray-500">
                Remballez soigneusement l&apos;article dans son emballage
                d&apos;origine avec l&apos;étiquette de retour fournie.
              </p>
            </div>
            <div className="border border-verone-gray-200 rounded-lg p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-verone-gray-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-5 w-5 text-verone-gray-600" />
              </div>
              <h3 className="font-medium text-verone-black mb-2">
                3. Remboursement
              </h3>
              <p className="text-xs text-verone-gray-500">
                Après vérification, le remboursement est effectué sous 14 jours
                sur votre moyen de paiement initial.
              </p>
            </div>
          </div>
        </section>

        {/* Defective */}
        <section className="bg-verone-gray-50 rounded-lg p-6">
          <h2 className="font-playfair text-xl font-bold text-verone-black mb-3">
            Article défectueux ou endommagé ?
          </h2>
          <p className="text-sm text-verone-gray-600 leading-relaxed mb-4">
            Si votre article est arrivé endommagé ou présente un défaut de
            fabrication, contactez-nous dans les 48 heures suivant la réception
            avec des photos. Nous prendrons en charge le retour et vous
            proposerons un remplacement ou un remboursement intégral.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-verone-black text-verone-white px-6 py-2.5 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
          >
            Nous contacter
          </Link>
        </section>
      </div>
    </div>
  );
}
