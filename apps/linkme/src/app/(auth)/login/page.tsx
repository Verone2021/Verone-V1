'use client';

/**
 * Page de connexion LinkMe - Design 2026
 *
 * Design:
 * - Layout split plein ecran (comme back-office)
 * - Gauche: Sphere sur fond gradient turquoise
 * - Droite: Formulaire sur fond blanc
 *
 * @module LoginPage
 * @since 2025-12-01
 * @updated 2026-01-06 - Split plein ecran
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

import { LandingHeader } from '@/components/landing';
import {
  SphereImageGrid,
  type SphereImageData,
} from '@/components/ui/SphereImageGrid';
import { useAuth } from '@/contexts/AuthContext';

// Images de demonstration pour la sphere
const DEMO_SPHERE_IMAGES: SphereImageData[] = Array.from(
  { length: 20 },
  (_, i) => ({
    id: `demo-${i + 1}`,
    src: '/logo-linkme.png',
    alt: `LinkMe ${i + 1}`,
  })
);

// Wrapper pour Suspense
export default function LoginPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5DBEBB]/30 via-white to-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#5DBEBB]" />
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
  const { signIn, user, initializing } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [sphereImages, setSphereImages] =
    useState<SphereImageData[]>(DEMO_SPHERE_IMAGES);

  // Configuration de la page
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
      role: 'Org Independante',
    },
  ];

  const redirectUrl = searchParams.get('redirect') ?? '/';

  type GlobeApiItem = {
    id: string;
    name: string;
    image_url: string;
    item_type: 'product' | 'organisation';
  };

  // Charger la configuration
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
            globe_rotation_speed: (data.globe_rotation_speed ?? 0.003) * 100,
          });
        }
      } catch {
        // Config par defaut
      }
    }
    void loadPageConfig();
  }, []);

  // Charger les images
  useEffect(() => {
    async function loadSphereImages(): Promise<void> {
      try {
        const response = await fetch('/api/globe-items');
        if (response.ok) {
          const data = (await response.json()) as { items: GlobeApiItem[] };
          if (data.items && data.items.length > 0) {
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
        // Images demo
      }
    }
    void loadSphereImages();
  }, []);

  // Rediriger si connecte
  useEffect(() => {
    if (!initializing && user) {
      router.push(redirectUrl);
    }
  }, [user, initializing, router, redirectUrl]);

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

      // Succes : reset loading, le useEffect redirigera automatiquement
      setLoading(false);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
      setLoading(false);
    }
  };

  // Loader initial
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5DBEBB]/30 via-white to-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#5DBEBB]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Landing */}
      <LandingHeader />

      {/* Main Content - avec pt-16 pour compenser le header fixe */}
      <div className="flex-1 flex pt-16">
        {/* Gauche: Sphere sur fond gradient - plein ecran */}
        {pageConfig.globe_enabled && (
          <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#7E84C0]/20 via-[#7E84C0]/10 to-white flex-col items-center justify-center">
            {/* Sphere 3D avec logo en arriere-plan */}
            <div className="relative flex items-center justify-center">
              {/* Logo en arriere-plan - meme diametre que la sphere */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/Linkme-fondblanc.png"
                  alt="LinkMe"
                  width={440}
                  height={440}
                  className="w-[440px] h-[440px] object-contain opacity-55 drop-shadow-sm"
                />
              </div>
              {/* Sphere 3D centree */}
              <SphereImageGrid
                images={sphereImages}
                containerSize={575}
                sphereRadius={220}
                autoRotate
                autoRotateSpeed={pageConfig.globe_rotation_speed}
                baseImageScale={0.15}
              />
            </div>
          </div>
        )}

        {/* Droite: Formulaire sur fond blanc - plein ecran */}
        <div
          className={`flex-1 flex items-center justify-center bg-white p-6 sm:p-10 ${
            pageConfig.globe_enabled ? 'lg:w-1/2' : 'w-full'
          }`}
        >
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#183559]">Connexion</h1>
              <p className="text-[#183559] text-sm mt-2">Espace Utilisateurs</p>
            </div>

            {/* Bouton comptes test */}
            <button
              type="button"
              onClick={() => setShowTestAccounts(!showTestAccounts)}
              className="w-full mb-5 flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm hover:bg-amber-100 transition-all duration-200 font-medium"
            >
              <Info className="h-4 w-4" />
              Comptes de test (DEV)
            </button>

            {/* Panel comptes test */}
            {showTestAccounts && (
              <div className="mb-5 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#183559]">
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
                      className="w-full text-left p-3 bg-white border border-gray-100 rounded-lg hover:border-[#5DBEBB] hover:bg-[#5DBEBB]/5 transition-all duration-200"
                    >
                      <div className="text-sm font-medium text-[#183559]">
                        {account.role}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        {account.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
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
                  className="block text-sm font-medium text-[#183559] mb-2"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-[#5DBEBB]/30 focus:border-[#5DBEBB] outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#183559] mb-2"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 bg-white focus:ring-2 focus:ring-[#5DBEBB]/30 focus:border-[#5DBEBB] outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#183559] transition-colors"
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
                className="w-full bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/60 text-white py-3.5 rounded-xl font-semibold hover:from-[#4CA9A6] hover:to-[#4CA9A6]/60 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:from-[#3976BB]/80 disabled:to-[#3976BB]/50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none shadow-md"
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
                className="text-sm text-[#3976BB] hover:text-[#5DBEBB] hover:underline block transition-colors duration-200"
              >
                Mot de passe oublie ?
              </a>
              <p className="text-sm text-gray-500">
                Pas encore partenaire ?{' '}
                <a
                  href="#"
                  className="text-[#5DBEBB] hover:underline font-medium"
                >
                  Contactez-nous
                </a>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                En vous connectant, vous acceptez nos{' '}
                <a href="#" className="text-[#3976BB] hover:underline">
                  conditions d&apos;utilisation
                </a>{' '}
                et notre{' '}
                <a href="#" className="text-[#3976BB] hover:underline">
                  politique de confidentialite
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
