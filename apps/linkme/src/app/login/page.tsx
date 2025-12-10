'use client';

/**
 * Page de connexion LinkMe
 *
 * Permet aux utilisateurs avec rôle LinkMe de se connecter
 * Vérifie l'accès via user_app_roles (app='linkme')
 *
 * @module LoginPage
 * @since 2025-12-01
 */

import { useState, useEffect, Suspense } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  LogIn,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  X,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

// Wrapper pour Suspense (useSearchParams nécessite Suspense en Next.js 15)
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  // Comptes de test (DEV ONLY)
  const TEST_ACCOUNTS = [
    {
      email: 'admin@pokawa-test.fr',
      password: 'TestLinkMe2025',
      role: 'Enseigne Admin (Pokawa)',
    },
    {
      email: 'test-config-modal@pokawa-test.fr',
      password: 'TestLinkMe2025',
      role: 'Org Indépendante',
    },
  ];

  // URL de redirection après connexion
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Connexion réussie - redirection gérée par useEffect
      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Afficher un loader pendant le chargement initial
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-blue-600 mb-1">LINKME</h1>
          </Link>
          <p className="text-gray-600 text-sm">Espace Partenaires & Affiliés</p>
        </div>

        {/* DEV: Bouton comptes de test */}
        <button
          type="button"
          onClick={() => setShowTestAccounts(!showTestAccounts)}
          className="w-full mb-4 flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs hover:bg-amber-100 transition-colors"
        >
          <Info className="h-3.5 w-3.5" />
          Comptes de test (DEV)
        </button>

        {/* Panel comptes de test */}
        {showTestAccounts && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                Comptes de test
              </span>
              <button
                type="button"
                onClick={() => setShowTestAccounts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {TEST_ACCOUNTS.map((account, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                    setShowTestAccounts(false);
                  }}
                  className="w-full text-left p-2 bg-white border border-gray-100 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-xs font-medium text-gray-900">
                    {account.role}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {account.email}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Mot de passe: {account.password}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Bouton connexion */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Liens */}
        <div className="mt-6 text-center space-y-3">
          <a href="#" className="text-sm text-blue-600 hover:underline block">
            Mot de passe oublié ?
          </a>
          <p className="text-sm text-gray-500">
            Pas encore partenaire ?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Contactez-nous
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            En vous connectant, vous acceptez nos{' '}
            <a href="#" className="text-blue-500 hover:underline">
              conditions d&apos;utilisation
            </a>{' '}
            et notre{' '}
            <a href="#" className="text-blue-500 hover:underline">
              politique de confidentialité
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
