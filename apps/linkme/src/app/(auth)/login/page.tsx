'use client';

/**
 * Page de connexion LinkMe - Split Layout avec Sphère 3D
 *
 * Design 2026:
 * - Gauche (60%): Sphère 3D avec images produits (fond blanc)
 * - Droite (40%): Formulaire de connexion
 *
 * @module LoginPage
 * @since 2025-12-01
 * @updated 2026-01-06 - Nouveau composant SphereImageGrid
 */

import { useState, useEffect, Suspense } from 'react';

import Image from 'next/image';
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

import {
  SphereImageGrid,
  type SphereImageData,
} from '@/components/ui/SphereImageGrid';
import { useAuth } from '@/contexts/AuthContext';

// Images de démonstration pour la sphère (en attendant l'API)
const DEMO_SPHERE_IMAGES: SphereImageData[] = Array.from(
  { length: 20 },
  (_, i) => ({
    id: `demo-${i + 1}`,
    src: '/logo-linkme.png',
    alt: `LinkMe ${i + 1}`,
  })
);

// Wrapper pour Suspense (useSearchParams nécessite Suspense en Next.js 15)
export default function LoginPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-linkme-turquoise" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [sphereImages, setSphereImages] =
    useState<SphereImageData[]>(DEMO_SPHERE_IMAGES);

  // Configuration de la page (globe, etc.)
  const [pageConfig, setPageConfig] = useState<{
    globe_enabled: boolean;
    globe_rotation_speed: number;
  }>({ globe_enabled: true, globe_rotation_speed: 0.3 });

  // Comptes de test (DEV ONLY)
  const TEST_ACCOUNTS = [
    {
      email: 'admin@pokawa-test.fr',
      password: 'TestLinkMe2025',
      role: 'Enseigne Admin (Pokawa)',
    },
    {
      email: 'test-org@verone.fr',
      password: 'TestLinkMe2025',
      role: 'Org Indépendante',
    },
  ];

  // URL de redirection après connexion
  const redirectUrl = searchParams.get('redirect') ?? '/';

  // Type pour la réponse API
  type GlobeApiItem = {
    id: string;
    name: string;
    image_url: string;
    item_type: 'product' | 'organisation';
  };

  // Charger la configuration de la page
  useEffect(() => {
    async function loadPageConfig(): Promise<void> {
      try {
        const response = await fetch('/api/page-config/login');
        if (response.ok) {
          const data = (await response.json()) as {
            globe_enabled: boolean;
            globe_rotation_speed: number;
          };
          setPageConfig({
            globe_enabled: data.globe_enabled ?? true,
            globe_rotation_speed: (data.globe_rotation_speed ?? 0.003) * 100, // Convert to SphereImageGrid scale
          });
        }
      } catch {
        // Garder la config par défaut si l'API échoue
      }
    }
    void loadPageConfig();
  }, []);

  // Charger les images depuis l'API
  useEffect(() => {
    async function loadSphereImages(): Promise<void> {
      try {
        const response = await fetch('/api/globe-items');
        if (response.ok) {
          const data = (await response.json()) as { items: GlobeApiItem[] };
          if (data.items && data.items.length > 0) {
            // Dupliquer les images pour remplir la sphère (minimum 20 images)
            const baseImages = data.items.map((item: GlobeApiItem) => ({
              id: item.id,
              src: item.image_url,
              alt: item.name,
            }));

            const images: SphereImageData[] = [];
            for (let i = 0; i < 30; i++) {
              const baseIndex = i % baseImages.length;
              images.push({
                ...baseImages[baseIndex],
                id: `sphere-${i}`,
              });
            }
            setSphereImages(images);
          }
        }
      } catch {
        // Garder les images de démo si l'API échoue
      }
    }
    void loadSphereImages();
  }, []);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
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
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Afficher un loader pendant le chargement initial
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-linkme-turquoise" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Gauche: Sphère 3D (60%) - Desktop only */}
      {pageConfig.globe_enabled && (
        <div className="hidden lg:flex w-3/5 bg-white flex-col items-center justify-center relative py-8">
          {/* Logo LinkMe centré au-dessus de la sphère */}
          <div className="mb-8 z-20">
            <Image
              src="/logo-linkme-full.png"
              alt="LinkMe"
              width={200}
              height={200}
              className="w-40 h-40 object-contain"
              priority
            />
          </div>

          {/* Sphère 3D centrée */}
          <div className="relative z-10">
            <SphereImageGrid
              images={sphereImages}
              containerSize={450}
              sphereRadius={160}
              autoRotate
              autoRotateSpeed={pageConfig.globe_rotation_speed}
              baseImageScale={0.12}
            />
          </div>
        </div>
      )}

      {/* Droite: Formulaire (40% si globe, 100% sinon) */}
      <div
        className={`w-full flex items-center justify-center p-6 sm:p-8 bg-gray-50 ${
          pageConfig.globe_enabled ? 'lg:w-2/5' : ''
        }`}
      >
        <div className="w-full max-w-md">
          {/* Header avec Logo (mobile only si globe activé) */}
          <div className="text-center mb-6">
            <Link
              href="/"
              className={`inline-block mb-2 ${pageConfig.globe_enabled ? 'lg:hidden' : ''}`}
            >
              <Image
                src="/logo-linkme.png"
                alt="LinkMe"
                width={160}
                height={44}
                className="h-11 w-auto mx-auto"
                priority
              />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h1>
            <p className="text-gray-500 text-sm">
              Espace Partenaires & Affiliés
            </p>
          </div>

          {/* DEV: Bouton comptes de test */}
          <button
            type="button"
            onClick={() => setShowTestAccounts(!showTestAccounts)}
            className="w-full mb-4 flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm hover:bg-amber-100 transition-colors font-medium"
          >
            <Info className="h-4 w-4" />
            Comptes de test (DEV)
          </button>

          {/* Panel comptes de test */}
          {showTestAccounts && (
            <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-linkme-marine">
                  Comptes de test
                </span>
                <button
                  type="button"
                  onClick={() => setShowTestAccounts(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
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
                    className="w-full text-left p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-linkme-turquoise hover:bg-linkme-turquoise/5 transition-all"
                  >
                    <div className="text-sm font-medium text-linkme-marine">
                      {account.role}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {account.email}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Mot de passe:{' '}
                      <span className="font-mono">{account.password}</span>
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
          <form
            onSubmit={(e): void => {
              void handleSubmit(e);
            }}
            className="space-y-5"
          >
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
                className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 bg-white focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
              className="w-full bg-linkme-turquoise text-white py-3 rounded-lg font-semibold hover:bg-linkme-turquoise/90 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
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
            <a
              href="#"
              className="text-sm text-linkme-turquoise hover:underline block"
            >
              Mot de passe oublié ?
            </a>
            <p className="text-sm text-gray-500">
              Pas encore partenaire ?{' '}
              <a href="#" className="text-linkme-turquoise hover:underline">
                Contactez-nous
              </a>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              En vous connectant, vous acceptez nos{' '}
              <a href="#" className="text-linkme-turquoise hover:underline">
                conditions d&apos;utilisation
              </a>{' '}
              et notre{' '}
              <a href="#" className="text-linkme-turquoise hover:underline">
                politique de confidentialité
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
