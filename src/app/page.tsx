/**
 * 🏠 Page d'Accueil Vérone Back Office
 *
 * Landing page avec authentification - Design System Vérone
 */

import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">

        {/* Logo Vérone */}
        <div className="mb-12 text-center">
          <h1 className="font-logo text-6xl font-light tracking-wider text-black mb-4">
            VÉRONE
          </h1>
          <p className="text-xl text-black opacity-70 font-light">
            Back Office
          </p>
        </div>

        {/* Description */}
        <div className="max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-light text-black mb-6">
            CRM/ERP modulaire pour la décoration d'intérieur
          </h2>
          <p className="text-lg text-black opacity-70 leading-relaxed">
            Gérez votre catalogue, vos commandes, votre stock et vos clients
            avec une solution moderne et élégante conçue spécialement pour
            les professionnels de la décoration haut de gamme.
          </p>
        </div>

        {/* CTA Principal */}
        <div className="flex flex-col items-center space-y-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-black hover:bg-black/90 transition-all duration-200 border border-black"
          >
            Se connecter
          </Link>

          <p className="text-sm text-black opacity-50">
            Accédez à votre espace de gestion
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-24 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Catalogue */}
            <div className="text-center p-6 border border-black/10 bg-white hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 bg-black/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-black mb-2">Catalogue</h3>
              <p className="text-sm text-black opacity-70">
                Gérez vos produits, collections et tarifs avec des catalogues partageables
              </p>
            </div>

            {/* Commandes */}
            <div className="text-center p-6 border border-black/10 bg-white hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 bg-black/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.001" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-black mb-2">Commandes</h3>
              <p className="text-sm text-black opacity-70">
                Suivez vos commandes clients du devis à la livraison
              </p>
            </div>

            {/* Clients */}
            <div className="text-center p-6 border border-black/10 bg-white hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 bg-black/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-black mb-2">Clients</h3>
              <p className="text-sm text-black opacity-70">
                Gérez votre relation client et historique des projets
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer minimal */}
      <footer className="border-t border-black/10 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-black opacity-50">
            © 2025 Vérone. Décoration et mobilier d'intérieur haut de gamme.
          </p>
        </div>
      </footer>
    </div>
  )
}