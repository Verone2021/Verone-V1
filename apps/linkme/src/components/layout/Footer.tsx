import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo & Description */}
          <div>
            <span className="text-xl font-bold text-blue-400">LINKME</span>
            <p className="mt-4 text-gray-400 text-sm">
              Plateforme d'affiliation pour les professionnels de la décoration
              et du mobilier d'intérieur.
            </p>
          </div>

          {/* Liens */}
          <div>
            <h3 className="font-semibold text-base mb-3">Liens utiles</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <a
                  href="https://verone.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Vérone.fr
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-base mb-3">Contact</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>contact@verone.fr</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} LinkMe by Vérone. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
