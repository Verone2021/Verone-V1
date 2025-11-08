/**
 * 🏠 Page d'accueil Vérone - Interface minimaliste
 *
 * Page statique simple avec logo, titre et bouton de connexion.
 * Aucune logique côté client pour éviter les blocages.
 */

import Image from 'next/image';
import Link from 'next/link';

import { LogIn } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="verone-homepage-center bg-white p-4">
      <div className="verone-content-center w-full max-w-md mx-auto space-y-8">
        {/* Logo Vérone épuré et agrandi */}
        <div className="mx-auto w-48 h-24 relative">
          <Image
            src="/logo-verone-clean.png"
            alt="Vérone"
            fill
            sizes="(max-width: 768px) 100vw, 192px"
            className="object-contain"
            priority
            style={{
              objectPosition: 'center top',
              clipPath: 'inset(0 0 45% 0)',
            }}
          />
        </div>

        {/* Sous-titre uniquement */}
        <div className="space-y-2">
          <p className="text-xl text-black opacity-80 font-medium">
            Back Office
          </p>
        </div>

        {/* Bouton de connexion */}
        <div className="pt-4">
          <Link href="/login">
            <ButtonV2 size="lg" variant="primary">
              <LogIn className="mr-2 h-5 w-5" />
              Se connecter
            </ButtonV2>
          </Link>
        </div>

        {/* Version info */}
        <div className="pt-8 text-xs text-black opacity-40">
          <p>Version MVP • Système de gestion Vérone</p>
        </div>
      </div>
    </div>
  );
}
