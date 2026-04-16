'use client';

import { useEffect, useState } from 'react';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@verone/types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: (
            notification?: (n: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
            }) => void
          ) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  '815096025483-lvlqgje963p9dav6nit7i61lvaamlisv.apps.googleusercontent.com';

function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function GoogleAuthButton() {
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      )
    ) {
      if (window.google?.accounts?.id) {
        setGsiReady(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setGsiReady(true);
    };

    script.onerror = () => {
      console.error(
        '[GoogleAuth] Failed to load Google Identity Services script'
      );
      setError('Impossible de charger Google. Veuillez réessayer.');
    };

    document.head.appendChild(script);
  }, []);

  const handleGoogleLogin = () => {
    if (!gsiReady || !window.google?.accounts?.id) {
      setError('Google Identity Services non disponible. Veuillez réessayer.');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createSupabaseClient();

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        void (async () => {
          try {
            const { data, error: signInError } =
              await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
              });

            if (signInError) {
              console.error(
                '[GoogleAuth] signInWithIdToken error:',
                signInError.message
              );
              setError('Erreur de connexion Google. Veuillez réessayer.');
              setLoading(false);
              return;
            }

            if (data.user) {
              const existingSource = data.user.user_metadata?.source as
                | string
                | undefined;
              if (!existingSource) {
                const { error: updateError } = await supabase.auth.updateUser({
                  data: { source: 'site-internet' },
                });
                if (updateError) {
                  console.error(
                    '[GoogleAuth] Failed to update user metadata:',
                    updateError.message
                  );
                }
              }
            }

            window.location.href = '/compte';
          } catch (err: unknown) {
            console.error('[GoogleAuth] Unexpected error during sign-in:', err);
            setError('Une erreur inattendue est survenue. Veuillez réessayer.');
            setLoading(false);
          }
        })();
      },
    });

    window.google.accounts.id.prompt(notification => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.warn('[GoogleAuth] GSI prompt not displayed or skipped');
        setError(
          "Le popup Google n'a pas pu s'afficher. Vérifiez votre navigateur."
        );
        setLoading(false);
      }
    });
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading || !gsiReady}
        className="w-full flex items-center justify-center gap-3 bg-white border border-verone-gray-300 text-verone-gray-700 py-3 rounded-lg font-medium hover:bg-verone-gray-50 transition-colors text-sm disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {loading ? 'Connexion...' : 'Continuer avec Google'}
      </button>
      {error !== null && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
