/**
 * Page « Pour les créateurs » - LinkMe
 *
 * Landing persona créateurs de contenu.
 * Positionnement : ambassadeur de marque avec une vraie marge.
 * Keyword cible : "ambassadeur de marque"
 *
 * @module PourLesCreateursPage
 * @since 2026-05-13
 * @updated 2026-05-13 - LM-PUB-002 : réécriture contenu V2, SSG forcé
 */

import Link from 'next/link';

import {
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  SlidersHorizontal,
  Share2,
  X,
} from 'lucide-react';
import type { Metadata } from 'next';

import { FaqJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    'LinkMe pour les créateurs — Ambassadeur de marque avec une vraie marge',
  description:
    'LinkMe te donne accès à un catalogue de marques sélectionnées. Tu fixes ta marge, tu partages ta sélection. Commission réelle sur chaque vente.',
  openGraph: {
    title:
      'LinkMe pour les créateurs — Ambassadeur de marque avec une vraie marge',
    description:
      'LinkMe te donne accès à un catalogue de marques sélectionnées. Tu fixes ta marge, tu partages ta sélection. Commission réelle sur chaque vente.',
    url: '/pour-les-createurs',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkMe pour les créateurs',
      },
    ],
  },
  alternates: {
    canonical: '/pour-les-createurs',
  },
};

const STEPS = [
  {
    number: '01',
    icon: LayoutGrid,
    title: 'Parcours le catalogue multi-marques',
    description:
      'Choisis tes produits dans le catalogue multi-marques — déco, éclairage, végétal, électronique et plus.',
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Configure ta marge produit par produit',
    description:
      "Pour chaque produit de ta sélection, fixe ton prix de vente dans la fourchette autorisée. Le système feux tricolores te guide : vert pour vendre vite, orange pour l'équilibre, rouge pour maximiser ta marge unitaire.",
    color: '#7E84C0',
    bgGradient: 'from-[#7E84C0]/10 to-[#7E84C0]/5',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Partage ta sélection à ton audience',
    description:
      'Touche ta commission sur chaque vente générée via ton lien. Tracée en temps réel dans ton dashboard.',
    color: '#3976BB',
    bgGradient: 'from-[#3976BB]/10 to-[#3976BB]/5',
  },
];

const COMPARISON_ROWS = [
  {
    label: 'Commission',
    linkme: 'Marge que tu configures',
    amazon: '1–3 % fixe',
  },
  {
    label: 'Catalogue',
    linkme: 'Marques sélectionnées',
    amazon: '350 M produits génériques',
  },
  {
    label: 'Image',
    linkme: 'Ta sélection, ton univers',
    amazon: 'Page Amazon',
  },
  {
    label: 'Accès',
    linkme: 'Sur demande (réseau qualitatif)',
    amazon: 'Ouvert à tous',
  },
];

const FAQ_ITEMS = [
  {
    q: "C'est quoi la différence avec un programme d'affiliation classique ?",
    a: 'Avec un programme classique, ta commission est fixée par la marque — souvent entre 1 et 5 %. Avec LinkMe, tu fixes toi-même ta marge sur chaque produit, dans une fourchette autorisée. Tu travailles avec plusieurs marques depuis un seul endroit, et tu gardes une image cohérente au lieu de renvoyer vers des pages Amazon ou Zalando.',
  },
  {
    q: 'Combien puis-je gagner comme ambassadeur LinkMe ?',
    a: "Ça dépend de ta marge configurée et du volume de ventes que tu génères. Les ambassadeurs actifs touchent entre 15 % et 35 % sur chaque produit vendu. Sur une lampe à 120 € avec une marge de 25 %, tu touches 30 €. Sur 10 ventes par mois, c'est 300 €. Tu vois ton gain estimé en temps réel avant de publier.",
  },
  {
    q: "Est-ce qu'il faut un minimum d'abonnés ?",
    a: "Non. On ne regarde pas le nombre d'abonnés mais la qualité et la cohérence de ton audience. Un créateur avec 2 000 abonnés très engagés sur la déco convertit souvent mieux qu'un compte généraliste à 50 000. On regarde ton profil, tes contenus, ton univers.",
  },
  {
    q: 'Qui gère les commandes et les livraisons ?',
    a: 'LinkMe gère tout de A à Z : commandes, expéditions, service client, retours, facturation. Toi, tu te concentres sur la recommandation. Tu ne vois jamais un colis, tu ne réponds jamais à un client mécontent.',
  },
  {
    q: 'Comment je reçois mes commissions ?',
    a: 'Tes commissions sont versées directement sur ton compte bancaire, à un rythme régulier (mensuel par défaut). Tu reçois un récapitulatif clair de tes ventes et commissions, prêt pour ta comptabilité. Aucune facture à produire, aucune relance.',
  },
];

export default function PourLesCreateursPage() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
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
            Recommande les bonnes marques.{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
              Encaisse vraiment.
            </span>
          </h1>
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

      {/* Douleur */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl sm:text-2xl font-medium text-[#183559] leading-relaxed">
            Tu envoies des liens Amazon à 2&nbsp;% de commission.
            <br />
            <span className="text-[#183559]/60">
              Ton audience mérite mieux. Toi aussi.
            </span>
          </p>
        </div>
      </section>

      {/* Différenciation — tableau */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              LinkMe vs Amazon Affiliation
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-[#183559]/50 w-1/3" />
                  <th className="text-center py-3 px-4 font-semibold text-[#5DBEBB]">
                    LinkMe
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-[#183559]/40">
                    Amazon Affiliation
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? 'bg-gray-50/40' : 'bg-white'}
                  >
                    <td className="py-4 px-4 font-medium text-[#183559]">
                      {row.label}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[#183559]/80">
                        <CheckCircle2 className="h-4 w-4 text-[#5DBEBB] flex-shrink-0" />
                        {row.linkme}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[#183559]/40">
                        <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        {row.amazon}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#5DBEBB]/10 rounded-full text-sm font-medium text-[#5DBEBB] mb-4">
              3 étapes
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Comment ça marche
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
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

      {/* Pour qui */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559] mb-6">
            Pour qui ?
          </h2>
          <p className="text-lg text-[#183559]/70 leading-relaxed">
            LinkMe est fait pour toi si tu crées du contenu autour de la maison,
            la déco, le lifestyle — et que ton audience te fait confiance pour
            ses choix produits.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map(item => (
              <details
                key={item.q}
                className="group bg-white rounded-xl border border-gray-100 open:shadow-sm"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none p-5 font-semibold text-[#183559]">
                  <span>{item.q}</span>
                  <CheckCircle2 className="h-5 w-5 text-[#5DBEBB] flex-shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="px-5 pb-5 text-sm text-[#183559]/70 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559] via-[#183559] to-[#3976BB]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Ta prochaine recommandation mérite d&apos;être rémunérée.
          </h2>
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
