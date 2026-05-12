import type { Metadata } from 'next';

import { HeroAbout } from '@/components/about/HeroAbout';
import { StorytellingAbout } from '@/components/about/StorytellingAbout';
import { ManifesteAbout } from '@/components/about/ManifesteAbout';
import { ClotureAbout } from '@/components/about/ClotureAbout';

export const metadata: Metadata = {
  title: 'À propos de Vérone — Pas un catalogue, un regard',
  description:
    "Vérone sélectionne ce qui mérite d'exister. Découvre l'histoire derrière ce regard exigeant — mille pièces vues, cinquante retenues. Ce que nous sommes.",
  alternates: { canonical: '/a-propos' },
};

export default function AProposPage() {
  return (
    <div>
      {/* 1. Hero nuit charbon (Stitch ✅) */}
      <HeroAbout />

      {/* 2. Storytelling — photo gauche + prose droite (Stitch ✅) */}
      <StorytellingAbout />

      {/* 3. Manifeste — 3 valeurs avec filets verticaux (Stitch ✅) */}
      <ManifesteAbout />

      {/* 4. Clôture citation "Habiter le silence" (Stitch ✅) */}
      <ClotureAbout />
    </div>
  );
}
