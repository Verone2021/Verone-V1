import Link from 'next/link';

import { signup } from '../actions';
import { GoogleAuthButton } from '../google-auth-button';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-playfair font-bold">Créer un compte</h1>
          <p className="text-verone-gray-500 mt-2">
            Rejoignez l&apos;univers Vérone
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error === 'missing_fields'
              ? 'Veuillez remplir tous les champs obligatoires.'
              : decodeURIComponent(error)}
          </div>
        )}

        <GoogleAuthButton />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-verone-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-4 text-verone-gray-400">
              ou par email
            </span>
          </div>
        </div>

        <form className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-verone-gray-700 mb-1.5"
              >
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                placeholder="Marie"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-verone-gray-700 mb-1.5"
              >
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-verone-gray-700 mb-1.5"
            >
              Email <span className="text-red-500">*</span>
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
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-verone-gray-700 mb-1.5"
            >
              Téléphone{' '}
              <span className="text-verone-gray-400 font-normal">
                (optionnel)
              </span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-verone-gray-700 mb-1.5"
            >
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-verone-gray-400">
              Minimum 8 caractères
            </p>
          </div>

          <button
            formAction={signup}
            className="w-full bg-verone-black text-verone-white py-3 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-verone-gray-500">
          Déjà un compte ?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-verone-black hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
