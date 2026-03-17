import Link from 'next/link';

import { forgotPassword } from '../actions';

export default async function ForgotPasswordPage({
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
          <h1 className="text-3xl font-playfair font-bold">
            Mot de passe oublié
          </h1>
          <p className="text-verone-gray-500 mt-2">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error === 'missing_email'
              ? 'Veuillez entrer votre adresse email.'
              : decodeURIComponent(error)}
          </div>
        )}

        {message === 'check_email' ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Un email de réinitialisation a été envoyé. Vérifiez votre boîte de
              réception (et vos spams).
            </div>
            <Link
              href="/auth/login"
              className="block w-full text-center bg-verone-black text-verone-white py-3 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
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

              <button
                formAction={forgotPassword}
                className="w-full bg-verone-black text-verone-white py-3 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
              >
                Envoyer le lien
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-verone-gray-500">
              <Link
                href="/auth/login"
                className="font-medium text-verone-black hover:underline"
              >
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
