/**
 * Landing Page Audience Cards - LinkMe
 *
 * Section "Pour qui" — 3 cartes adressant les 3 audiences distinctes :
 * - Réseau (B2B prioritaire : enseignes, têtes de réseau, franchiseurs)
 * - Pro (architectes, décorateurs, consultants HCR, stylistes)
 * - Créateur (audience en ligne, prescripteurs grand public)
 *
 * Chaque carte renvoie vers sa page dédiée.
 *
 * @module LandingAudienceCards
 * @since 2026-05-17 - LM-MKT-COPY-001 (homepage multi-audience)
 */

import Link from 'next/link';

import { ArrowRight, Building2, Briefcase, Sparkles } from 'lucide-react';

const AUDIENCES = [
  {
    tag: 'Réseau',
    title: 'Vous avez un réseau. Faites-le vendre.',
    body: "Pokawa, Black & White, et d'autres réseaux utilisent LinkMe pour déployer un catalogue produit commun à tous leurs points de vente — et distribuer leur propre merchandising. Un seul tableau de bord. Toutes les commandes de tout le réseau, en temps réel.",
    cta: 'Voir la démo réseau',
    href: '/pour-les-enseignes',
    icon: Building2,
    accent: '#5DBEBB',
  },
  {
    tag: 'Pro',
    title: 'Vous prescrivez. Encaissez enfin dessus.',
    body: 'Architectes, décorateurs, consultants HCR, stylistes — vos recommandations génèrent des ventes que vous ne voyez pas. Créez votre sélection, partagez-la à vos clients, touchez une commission sur chaque commande.',
    cta: "Demander l'accès",
    href: '/pour-les-pros',
    icon: Briefcase,
    accent: '#7E84C0',
  },
  {
    tag: 'Créateur',
    title: 'Ton audience te fait confiance. Arrête de la monnayer à 2 %.',
    body: "Un catalogue de marques sélectionnées, une marge que tu configures, une sélection qui ressemble à ton univers. Bien au-dessus d'Amazon Affiliation.",
    cta: "Demander l'accès",
    href: '/pour-les-createurs',
    icon: Sparkles,
    accent: '#3976BB',
  },
];

export function LandingAudienceCards(): JSX.Element {
  return (
    <section
      id="audiences"
      className="py-16 lg:py-24 bg-white border-t border-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
            LinkMe s&apos;adapte à ta structure.
          </h2>
          <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
            Trois manières de vendre via LinkMe, selon ce que tu pilotes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {AUDIENCES.map(audience => (
            <Link
              key={audience.tag}
              href={audience.href}
              className="group relative flex flex-col bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ backgroundColor: `${audience.accent}1A` }}
                >
                  <audience.icon
                    className="h-5 w-5"
                    style={{ color: audience.accent }}
                  />
                </span>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: audience.accent,
                    backgroundColor: `${audience.accent}14`,
                  }}
                >
                  {audience.tag}
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#183559] mb-3 leading-snug">
                {audience.title}
              </h3>

              <p className="text-sm text-[#183559]/70 leading-relaxed flex-1">
                {audience.body}
              </p>

              <span
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                style={{ color: audience.accent }}
              >
                {audience.cta}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
