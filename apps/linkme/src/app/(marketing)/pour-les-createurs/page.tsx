/**
 * Page « Pour les créateurs » - LinkMe
 *
 * Landing persona créateurs de contenu (Instagram, TikTok, YouTube,
 * newsletters). Positionnement : monétiser son audience avec les
 * marques que tu choisis, sans stock ni logistique.
 *
 * @module PourLesCreateursPage
 * @since 2026-05-13
 */

import Link from 'next/link';

import {
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  Sparkles,
  SlidersHorizontal,
  Share2,
  Wallet,
  Tag,
  Coins,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monétise ton audience avec les marques que tu choisis',
  description:
    'Fini les 2 % Amazon. Avec LinkMe, tu choisis tes marques, tu fixes ta marge, tu touches une vraie commission. Accès sur demande.',
  openGraph: {
    title: 'Monétise ton audience avec les marques que tu choisis — LinkMe',
    description:
      'Catalogue multi-marques (déco, éclairage, végétal, électronique). Marge libre. Aucun stock à gérer.',
    url: '/pour-les-createurs',
  },
  alternates: {
    canonical: '/pour-les-createurs',
  },
};

const ELIGIBILITY = [
  'Tu animes une audience entre 1 000 et 50 000 abonnés (Instagram, TikTok, YouTube, newsletter, blog).',
  'Tu publies du contenu lifestyle, déco, tech, mode, cuisine, bien-être ou voyage.',
  'Tu produis du contenu régulièrement (au moins 2 publications par mois).',
  "Tu n'as pas envie de gérer du stock, de l'expédition ou du service client.",
];

const STEPS = [
  {
    number: '01',
    icon: LayoutGrid,
    title: 'Parcours le catalogue',
    description:
      'Accède aux produits de toutes les marques sélectionnées sur LinkMe — déco, éclairage, végétal, électronique et plus.',
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Crée ta sélection',
    description:
      'Compose une ou plusieurs sélections cohérentes avec ton audience. Chaque sélection a son propre lien partageable.',
    color: '#7E84C0',
    bgGradient: 'from-[#7E84C0]/10 to-[#7E84C0]/5',
  },
  {
    number: '03',
    icon: SlidersHorizontal,
    title: 'Configure ta marge',
    description:
      'Pour chaque produit, tu fixes la marge que tu veux ajouter au prix base fournisseur. Le feu tricolore te guide.',
    color: '#3976BB',
    bgGradient: 'from-[#3976BB]/10 to-[#3976BB]/5',
  },
  {
    number: '04',
    icon: Share2,
    title: 'Partage ton lien',
    description:
      'Stories, posts, bio, newsletter, vidéos. Ton lien est unique et traçable. Tu touches ta marge sur chaque commande.',
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
];

const EARNINGS_EXAMPLES = [
  {
    icon: Tag,
    productLabel: 'Lampe d’ambiance — base 80 €',
    margin: '+25 %',
    yourEarning: '20 €',
    color: '#5DBEBB',
  },
  {
    icon: Coins,
    productLabel: 'Table basse — base 280 €',
    margin: '+18 %',
    yourEarning: '50 €',
    color: '#7E84C0',
  },
  {
    icon: Wallet,
    productLabel: 'Enceinte connectée — base 195 €',
    margin: '+30 %',
    yourEarning: '58 €',
    color: '#3976BB',
  },
];

export default function PourLesCreateursPage(): JSX.Element {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7E84C0]/10 via-white to-[#5DBEBB]/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5DBEBB]/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#5DBEBB] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[#5DBEBB]">
              Accès sur demande
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#183559] leading-tight">
            Monétise ton audience avec{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
              les marques que tu choisis
            </span>
            .
          </h1>
          <p className="mt-6 text-lg text-[#183559]/70 max-w-2xl mx-auto">
            Fini les 2 % Amazon. Tu sélectionnes des produits dans un catalogue
            multi-marques, tu fixes ta marge, tu touches une vraie commission
            sur chaque vente. Sans stock, sans logistique.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-xl hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Demander l&apos;accès
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/comment-ca-marche"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-[#183559] border-2 border-[#183559]/20 rounded-xl hover:bg-[#183559]/5 transition-colors"
            >
              Voir comment ça marche
            </Link>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Tu corresponds si…
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              LinkMe sélectionne ses ambassadeurs. Voici les critères qu&apos;on
              regarde quand tu fais ta demande.
            </p>
          </div>
          <ul className="grid md:grid-cols-2 gap-4">
            {ELIGIBILITY.map(item => (
              <li
                key={item}
                className="flex items-start gap-3 bg-white rounded-xl p-5 border border-gray-100"
              >
                <CheckCircle2 className="h-5 w-5 text-[#5DBEBB] mt-0.5 flex-shrink-0" />
                <span className="text-[#183559]/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#5DBEBB]/10 rounded-full text-sm font-medium text-[#5DBEBB] mb-4">
              4 étapes
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Comment ça marche
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              De la première sélection à la première commission, tout est en
              ligne et autonome.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(step => (
              <div
                key={step.number}
                className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.bgGradient} flex items-center justify-center`}
                  >
                    <step.icon
                      className="h-6 w-6"
                      style={{ color: step.color }}
                    />
                  </div>
                  <span
                    className="text-3xl font-bold"
                    style={{ color: `${step.color}30` }}
                  >
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#183559] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#183559]/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Ce que tu touches concrètement
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              Tu fixes ta marge entre 15 % et 35 % selon le produit. Voici trois
              exemples réalistes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {EARNINGS_EXAMPLES.map(ex => (
              <div
                key={ex.productLabel}
                className="bg-white rounded-2xl p-6 border border-gray-100 text-center"
              >
                <div
                  className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${ex.color}15` }}
                >
                  <ex.icon className="h-6 w-6" style={{ color: ex.color }} />
                </div>
                <p className="text-sm text-[#183559]/60 mb-2">
                  {ex.productLabel}
                </p>
                <p className="text-xs text-[#183559]/40 mb-1">
                  Marge configurée
                </p>
                <p
                  className="text-lg font-semibold mb-3"
                  style={{ color: ex.color }}
                >
                  {ex.margin}
                </p>
                <p className="text-xs text-[#183559]/40 mb-1">
                  Tu touches par vente
                </p>
                <p className="text-3xl font-bold text-[#183559]">
                  {ex.yourEarning}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#183559]/50 mt-8">
            Les chiffres sont des exemples. La marge réelle dépend du produit et
            de la marque choisie.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559] via-[#183559] to-[#3976BB]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Prêt à monétiser ton audience pour de vrai ?
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
            Tu envoies ta demande. On regarde ton profil. On t&apos;ouvre
            l&apos;accès au catalogue.
          </p>
          <div className="mt-10">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-[#183559] bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Demander l&apos;accès
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
