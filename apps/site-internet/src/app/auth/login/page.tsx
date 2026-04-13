import Link from 'next/link';

import { login } from '../actions';
import { GoogleAuthButton } from '../google-auth-button';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const message = params.message;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-playfair font-bold">Connexion</h1>
          <p className="text-verone-gray-500 mt-2">
            Accédez à votre espace client Vérone
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error === 'missing_fields'
              ? 'Veuillez remplir tous les champs.'
              : decodeURIComponent(error)}
          </div>
        )}

        {message === 'check_email' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Inscription réussie ! Vérifiez votre email pour confirmer votre
            compte.
          </div>
        )}

        <GoogleAuthButton />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-verone-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-4 text-verone-gray-400">ou</span>
          </div>
        </div>

        <form className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-verone-gray-700 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-verone-gray-700"
              >
                Mot de passe
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-verone-gray-500 hover:text-verone-black transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            formAction={login}
            className="w-full bg-verone-black text-verone-white py-3 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-verone-gray-500">
          Pas encore de compte ?{' '}
          <Link
            href="/auth/register"
            className="font-medium text-verone-black hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
