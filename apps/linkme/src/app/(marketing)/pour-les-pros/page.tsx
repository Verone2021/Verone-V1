/**
 * Page « Pour les pros » - LinkMe
 *
 * Landing persona professionnels prescripteurs : architectes
 * d'intérieur, décorateurs, home stagers, coachs immobiliers,
 * stylistes. Positionnement : transformer chaque recommandation
 * client en commission, sans stock ni logistique.
 *
 * @module PourLesProsPage
 * @since 2026-05-13
 */

import Link from 'next/link';

import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Palette,
  Home,
  Briefcase,
  Camera,
  X,
  ShieldCheck,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Architectes, décorateurs, prescripteurs — touchez une commission',
  description:
    'Vous recommandez déjà des produits à vos clients. Transformez chaque recommandation en revenu avec LinkMe. Sans stock, sans logistique.',
  openGraph: {
    title:
      'Architectes, décorateurs, prescripteurs — touchez une commission — LinkMe',
    description:
      'Catalogue multi-marques, marge libre, commission claire. Votre client commande, vous touchez votre marge.',
    url: '/pour-les-pros',
  },
  alternates: {
    canonical: '/pour-les-pros',
  },
};

const PERSONAS = [
  {
    icon: Compass,
    title: "Architecte d'intérieur",
    description:
      'Tu prescris des produits dans tes projets. Touche une commission au lieu de simplement renvoyer vers une marque.',
    color: '#5DBEBB',
  },
  {
    icon: Palette,
    title: 'Décorateur',
    description:
      'Tes clients te demandent où acheter ce que tu choisis. Donne-leur un lien, garde une marge.',
    color: '#7E84C0',
  },
  {
    icon: Home,
    title: 'Home stager',
    description:
      'Tu équipes des biens en vente ou en location. Transforme tes choix en revenu récurrent.',
    color: '#3976BB',
  },
  {
    icon: Briefcase,
    title: 'Coach immobilier',
    description:
      'Tu accompagnes des acheteurs sur la décoration et l’aménagement. Monétise tes recommandations.',
    color: '#5DBEBB',
  },
  {
    icon: Camera,
    title: 'Styliste / set designer',
    description:
      'Tu sources du mobilier et de la déco pour des shootings. Réutilise tes choix pour gagner sur chaque vente.',
    color: '#7E84C0',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Accès au catalogue',
    description:
      'On valide ton profil pro et on t’ouvre le catalogue multi-marques. Tu vois les prix base fournisseur et les marges possibles.',
    color: '#5DBEBB',
  },
  {
    number: '02',
    title: 'Recommandation client',
    description:
      'Tu identifies les produits que tu veux conseiller. Tu crées une sélection par projet ou par client.',
    color: '#7E84C0',
  },
  {
    number: '03',
    title: 'Commande via ton lien',
    description:
      "Ton client passe commande via le lien que tu lui as envoyé. Tu n'avances pas un centime, tu ne gères pas l'expédition.",
    color: '#3976BB',
  },
  {
    number: '04',
    title: 'Commission',
    description:
      'Tu reçois ta marge sur chaque commande, virée directement sur ton compte. Tracé, transparent, sans paperasse.',
    color: '#5DBEBB',
  },
];

const COMPARISON_TRADITIONAL = [
  'Remise négociée à la tête du client',
  'Conditions floues, qui change selon la marque',
  'Versée à l’occasion, parfois en différé',
  'Souvent invisible pour ton client',
  'Tu deviens dépendant d’une seule marque',
];

const COMPARISON_LINKME = [
  'Marge claire, configurée par toi, produit par produit',
  'Conditions identiques sur tout le catalogue',
  'Commission virée automatiquement à chaque vente',
  'Ton client voit le prix final, rien de caché',
  'Tu travailles avec plusieurs marques en parallèle',
];

export default function PourLesProsPage(): JSX.Element {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3976BB]/10 via-white to-[#7E84C0]/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7E84C0]/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#7E84C0] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[#7E84C0]">
              Accès sur demande
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#183559] leading-tight">
            Transforme chaque{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
              recommandation en revenu
            </span>
            .
          </h1>
          <p className="mt-6 text-lg text-[#183559]/70 max-w-2xl mx-auto">
            Tu conseilles déjà des produits à tes clients. Avec LinkMe, chaque
            recommandation devient une commission claire — sur un catalogue
            multi-marques, sans stock à gérer ni logistique à porter.
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

      {/* Pour qui */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Pour qui ?
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              Si tu prescris du produit physique dans ton activité, LinkMe est
              pour toi.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {PERSONAS.map(p => (
              <div
                key={p.title}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${p.color}15` }}
                >
                  <p.icon className="h-6 w-6" style={{ color: p.color }} />
                </div>
                <h3 className="text-base font-semibold text-[#183559] mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-[#183559]/60 leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça fonctionne pour un pro */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Comment ça fonctionne pour un pro
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(s => (
              <div
                key={s.number}
                className="relative bg-white rounded-2xl p-6 border border-gray-100"
              >
                <span
                  className="text-4xl font-bold absolute top-4 right-5"
                  style={{ color: `${s.color}30` }}
                >
                  {s.number}
                </span>
                <h3 className="text-lg font-bold text-[#183559] mb-2 pr-10">
                  {s.title}
                </h3>
                <p className="text-sm text-[#183559]/60 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparatif */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              La différence avec les remises fournisseurs habituelles
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              On compare franchement. Les remises fournisseurs traditionnelles
              ont leurs avantages — mais pas tous.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Traditionnel */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <X className="h-5 w-5 text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-[#183559]">
                  Remise fournisseur classique
                </h3>
              </div>
              <ul className="space-y-3">
                {COMPARISON_TRADITIONAL.map(item => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-[#183559]/70"
                  >
                    <X className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* LinkMe */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#5DBEBB]/40 shadow-md">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[#5DBEBB]/15 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-[#5DBEBB]" />
                </div>
                <h3 className="text-lg font-bold text-[#183559]">
                  Avec LinkMe
                </h3>
              </div>
              <ul className="space-y-3">
                {COMPARISON_LINKME.map(item => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-[#183559]/80"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#5DBEBB] mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559] via-[#183559] to-[#3976BB]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Tu prescris déjà. Désormais, tu gagnes aussi.
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
            On regarde ton profil pro, on t&apos;ouvre l&apos;accès au catalogue
            multi-marques. Tu commences à recommander en touchant ta commission.
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
