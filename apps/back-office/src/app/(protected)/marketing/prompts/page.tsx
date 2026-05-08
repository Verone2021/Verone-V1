'use client';

import { MarketingStudio } from '@verone/marketing';

export default function MarketingPromptsPage() {
  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Studio Marketing IA — Génération d&apos;images
        </h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez vos produits, vos images de référence, choisissez la
          marque et la mise en scène. L&apos;IA génère une image cohérente avec
          votre charte, prête pour vos canaux.
        </p>
      </header>

      <MarketingStudio />
    </div>
  );
}
