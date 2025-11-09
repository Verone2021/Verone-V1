import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LINKME - Plateforme Vendeurs',
  description: 'Suivi des commissions et ventes pour vendeurs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="flex min-h-screen">
          <aside className="w-64 bg-white shadow-lg">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-blue-600">LINKME</h1>
              <p className="text-sm text-gray-600">Plateforme Vendeurs</p>
            </div>
            <nav className="px-4 space-y-2">
              <a href="/" className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                Dashboard
              </a>
              <a href="/commissions" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Mes Commissions
              </a>
              <a href="/ventes" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Mes Ventes
              </a>
              <a href="/statistiques" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Statistiques
              </a>
              <a href="/login" className="block px-4 py-2 text-red-600 hover:bg-gray-50 rounded-lg mt-4">
                Déconnexion
              </a>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
