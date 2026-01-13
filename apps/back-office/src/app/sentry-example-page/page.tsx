'use client';

/**
 * Page de test Sentry
 * Permet de déclencher une erreur test pour vérifier la configuration
 */
export default function SentryExamplePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Test Sentry Integration
        </h1>
        <p className="text-gray-600 mb-6">
          Cliquez sur le bouton ci-dessous pour déclencher une erreur test. Si
          Sentry est correctement configuré, vous verrez l'erreur dans votre
          dashboard Sentry.
        </p>
        <button
          onClick={() => {
            throw new Error('Sentry Test Error - This is a test!');
          }}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Déclencher une erreur test
        </button>
        <p className="text-sm text-gray-400 mt-4">
          Après le test, supprimez cette page.
        </p>
      </div>
    </div>
  );
}
