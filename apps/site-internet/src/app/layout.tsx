import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vérone - Mobilier Haut de Gamme',
  description: 'E-commerce mobilier et décoration d\'intérieur haut de gamme',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        {/* Header e-commerce */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Vérone</h1>
              <nav className="flex space-x-6">
                <a href="/" className="text-gray-700 hover:text-gray-900">Accueil</a>
                <a href="/catalogue" className="text-gray-700 hover:text-gray-900">Catalogue</a>
                <a href="/panier" className="text-gray-700 hover:text-gray-900">Panier</a>
                <a href="/compte" className="text-gray-700 hover:text-gray-900">Compte</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
            <p>&copy; 2025 Vérone. Tous droits réservés.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
