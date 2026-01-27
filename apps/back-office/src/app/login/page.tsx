'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useToggle } from '@verone/hooks';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader } from '@verone/ui';
import { Popover, PopoverTrigger, PopoverContent } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Eye, EyeOff, LogIn, Mail, Lock, Info } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, toggleShowPassword] = useToggle(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // Authentification avec Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        setError('Email ou mot de passe incorrect');
        return;
      }

      if (data.user) {
        // Attendre propagation des cookies (sécurité supplémentaire)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Succès - redirection vers dashboard
        const redirectUrl =
          new URLSearchParams(window.location.search).get('redirect') ||
          '/dashboard';
        router.push(redirectUrl);
      }
    } catch (_err) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - Image Hero (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 to-slate-700 overflow-hidden">
        {/* Placeholder gradient avec effet texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b86d1] via-[#844fc1] to-[#3b86d1] opacity-80" />

        {/* Blur zones pour profondeur */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />

        {/* Overlay gradient pour lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20" />

        {/* Logo VÉRONE centré */}
        <div className="absolute inset-0 flex items-center justify-center text-white z-10">
          <Image
            src="/images/logo-verone-text.png"
            alt="VÉRONE"
            width={700}
            height={140}
            className="drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))',
              mixBlendMode: 'screen',
            }}
            priority
          />
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-50 to-white">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-0 right-0 text-center">
          <h1 className="font-logo text-4xl tracking-wider text-black">
            VÉRONE
          </h1>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-0 bg-white">
          <CardHeader className="space-y-2 pb-6 pt-8">
            <h2 className="font-heading text-2xl text-center text-slate-900">
              Connexion
            </h2>
            <p className="text-sm text-slate-500 text-center">
              Accédez à votre Back Office
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900
                             placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-[#3b86d1] focus:border-transparent
                             transition-all duration-300"
                    placeholder="veronebyromeo@gmail.com"
                    required
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-lg bg-white text-slate-900
                             placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-[#3b86d1] focus:border-transparent
                             transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600
                             transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Bouton de connexion avec gradient */}
              <ButtonV2
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#3b86d1] to-[#844fc1] text-white font-medium
                         hover:shadow-xl hover:scale-[1.02] active:scale-100
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300 rounded-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connexion...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <LogIn className="h-5 w-5" />
                    <span>Se connecter</span>
                  </div>
                )}
              </ButtonV2>
            </form>

            {/* Credentials test - Popover discret */}
            <div className="flex justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-[#3b86d1]
                                   transition-colors duration-200 group"
                  >
                    <Info className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" />
                    <span>Accès test MVP</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-heading text-sm font-medium text-slate-900 mb-1">
                        Compte de test
                      </h4>
                      <p className="text-xs text-slate-500">
                        Utilisez ces identifiants pour accéder au Back Office
                      </p>
                    </div>
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-700">
                        <span className="text-slate-500 font-medium">
                          Email :
                        </span>
                        <code className="block mt-1 bg-white px-2 py-1 rounded text-[#3b86d1] font-mono text-xs border border-slate-200">
                          veronebyromeo@gmail.com
                        </code>
                      </div>
                      <div className="text-xs text-slate-700">
                        <span className="text-slate-500 font-medium">
                          Mot de passe :
                        </span>
                        <code className="block mt-1 bg-white px-2 py-1 rounded text-[#3b86d1] font-mono text-xs border border-slate-200">
                          Abc123456
                        </code>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-400 pt-2">
              Vérone Back Office — Version MVP 2025
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
