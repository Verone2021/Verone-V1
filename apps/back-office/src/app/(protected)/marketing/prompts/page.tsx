'use client';

import { PromptBuilder } from '@verone/marketing';
import { toast } from 'sonner';

export default function MarketingPromptsPage() {
  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Studio Marketing — Prompts Nano Banana
        </h1>
        <p className="text-sm text-muted-foreground">
          Choisis une marque et un preset pour générer un prompt structuré
          (Subject + Action + Scene + Camera + Lighting + Style + Realism +
          Format) prêt à coller dans Gemini Nano Banana.
        </p>
      </header>

      <PromptBuilder
        onCopySuccess={() =>
          toast.success('Prompt copié', {
            description:
              'Colle-le dans Gemini Nano Banana avec ton image de référence.',
          })
        }
        onCopyError={err =>
          toast.error('Copie impossible', { description: err.message })
        }
      />
    </div>
  );
}
