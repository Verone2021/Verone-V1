import type { Metadata } from 'next';

import { Providers } from '../../components/providers/Providers';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Connexion - LINKME',
  description: 'Connectez-vous à votre espace partenaire LinkMe.',
};

/**
 * Layout pour les pages d'authentification LinkMe
 * Design simple sans sidebar ni header
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gradient-to-br from-linkme-turquoise/5 via-white to-linkme-royal/5">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
