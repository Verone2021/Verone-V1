/**
 * 📄 Error Page Minimal Next.js 15 - Vérone Back Office
 *
 * Page d'erreur utilisée par Next.js pour les erreurs serveur (500, etc.)
 * Requis même en App Router pour fallback errors.
 */

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 border border-gray-200 text-center">
        <h1 className="text-3xl font-bold text-black mb-2">
          {statusCode || 'Erreur'}
        </h1>
        <h2 className="text-xl font-semibold text-black mb-4">
          {statusCode === 404 ? 'Page introuvable' : 'Erreur système'}
        </h2>
        <p className="text-gray-600 mb-8">
          Une erreur inattendue s'est produite.
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors"
        >
          Retour au Dashboard
        </a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
