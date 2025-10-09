/**
 * 📄 Document Minimal Next.js 15 - Vérone Back Office
 *
 * Ce fichier est REQUIS par Next.js 15 pour les pages d'erreur système
 * même en utilisant uniquement App Router.
 *
 * Il ne crée PAS de Pages Router complet - juste le minimum pour satisfaire
 * Next.js lors de la génération de pages comme /404 et /_error.
 *
 * @see https://nextjs.org/docs/messages/no-document-import-in-page
 */

import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="fr">
      <Head />
      <body className="h-full bg-white text-black antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
