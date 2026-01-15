import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "LINKME - Plateforme d'affiliation Vérone",
  description:
    "Découvrez les sélections de mobilier et décoration d'intérieur par nos partenaires affiliés.",
};

/**
 * Root Layout LinkMe
 * Layout racine requis par Next.js 15 App Router
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50/50">{children}</body>
    </html>
  );
}
