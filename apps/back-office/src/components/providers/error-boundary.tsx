'use client';

/**
 * Filet d'erreur au-dessus de TOUS les fournisseurs.
 *
 * Le trou qu'il bouche : dans l'App Router, une erreur levee *dans* un
 * fournisseur rendu par `app/layout.tsx` n'est pas attrapee par
 * `app/error.tsx`. Elle tombe dans `global-error.tsx`, qui demonte
 * l'application entiere ; « Reessayer » rejoue le meme rendu, donc le meme
 * plantage. C'est exactement la boucle vecue par une collaboratrice les 17 et
 * 18/09/2026.
 *
 * Ce composant est une vraie limite d'erreur React (classe + componentDidCatch).
 * Il en existait zero dans le depot avant ce sprint.
 *
 * @since 2026-09-18 - [BO-OBS-001]
 */

import { Component } from 'react';

import type { ErrorInfo, ReactNode } from 'react';

import posthog from 'posthog-js';

import { createClient } from '@verone/utils/supabase/client';

import {
  reportErrorToPosthog,
  shouldInitPosthog,
} from '@/lib/observability/posthog';

/** Drapeau de rechargement unique, pour ne jamais boucler. */
const RELOAD_FLAG = 'verone_chunk_reload';

/**
 * Un onglet reste ouvert pendant une mise en ligne demande ensuite des fichiers
 * que le deploiement a remplaces. Symptomes connus :
 */
const STALE_BUILD_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
] as const;

function isStaleBuildError(error: AppError): boolean {
  const haystack = `${error.name} ${error.message}`;
  return STALE_BUILD_PATTERNS.some(pattern => haystack.includes(pattern));
}

/** sessionStorage peut lever (navigation privee, cookies bloques). */
function readFlag(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFlag(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Sans sessionStorage, on ne recharge pas automatiquement : mieux vaut
    // afficher l'ecran que risquer une boucle.
  }
}

/** Next.js attache un `digest` aux erreurs venues du serveur. */
type AppError = Error & { digest?: string };

interface IErrorBoundaryState {
  error: AppError | null;
  /** Vrai quand un rechargement automatique a deja ete tente pour cette session. */
  staleBuildReloadFailed: boolean;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  IErrorBoundaryState
> {
  state: IErrorBoundaryState = { error: null, staleBuildReloadFailed: false };

  static getDerivedStateFromError(
    error: AppError
  ): Partial<IErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: AppError, info: ErrorInfo): void {
    console.error(
      '[back-office] Erreur attrapee au-dessus des fournisseurs:',
      error
    );

    if (shouldInitPosthog()) {
      reportErrorToPosthog(posthog, error, {
        source: 'error-boundary',
        component_stack: info.componentStack,
      });
    }

    if (!isStaleBuildError(error)) return;

    // Nouvelle version publiee : on recharge UNE fois, jamais deux.
    if (readFlag(RELOAD_FLAG) === null) {
      writeFlag(RELOAD_FLAG, '1');
      window.location.reload();
      return;
    }
    this.setState({ staleBuildReloadFailed: true });
  }

  private readonly handleRetry = (): void => {
    this.setState({ error: null, staleBuildReloadFailed: false });
  };

  private readonly handleReload = (): void => {
    try {
      window.sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      // sans importance : le rechargement suit
    }
    window.location.reload();
  };

  private readonly handleLogout = (): void => {
    // Deconnexion reelle, puis navigation DURE — jamais router.push
    // (piege AuthSessionMissingError, cf. code-standards.md). On quitte vers
    // /login dans tous les cas, y compris si signOut echoue : l'utilisateur
    // doit pouvoir sortir de cet ecran quoi qu'il arrive.
    const goToLogin = (): void => {
      window.location.href = '/login';
    };
    try {
      void createClient().auth.signOut().then(goToLogin).catch(goToLogin);
    } catch {
      goToLogin();
    }
  };

  render(): ReactNode {
    const { error, staleBuildReloadFailed } = this.state;
    if (!error) return this.props.children;

    const staleBuild = isStaleBuildError(error);

    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="w-full max-w-lg text-center">
          <h1 className="mb-3 text-xl font-semibold text-black md:text-2xl">
            {staleBuild
              ? 'Une nouvelle version vient d’être publiée'
              : 'Une erreur est survenue'}
          </h1>

          <p className="mb-6 text-sm text-gray-600 md:text-base">
            {staleBuild
              ? staleBuildReloadFailed
                ? 'Le rechargement automatique n’a pas suffi. Rechargez complètement la page ci-dessous.'
                : 'La page se recharge pour récupérer la dernière version.'
              : 'Votre travail enregistré n’est pas perdu. Choisissez une des options ci-dessous.'}
          </p>

          {error.digest !== undefined && (
            <p className="mb-6 rounded-md bg-gray-50 px-4 py-3 text-xs text-gray-500">
              Code technique :{' '}
              <span className="font-mono text-gray-700">{error.digest}</span>
              <br />
              Communiquez ce code au support.
            </p>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="h-11 w-full rounded-md bg-black px-5 text-sm font-medium text-white md:h-10 md:w-auto"
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="h-11 w-full rounded-md border border-gray-300 px-5 text-sm font-medium text-black md:h-10 md:w-auto"
            >
              Recharger complètement la page
            </button>
            <button
              type="button"
              onClick={this.handleLogout}
              className="h-11 w-full rounded-md border border-gray-300 px-5 text-sm font-medium text-black md:h-10 md:w-auto"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }
}
