/**
 * Page « Comment ça marche » - LinkMe
 *
 * Explication du fonctionnement de LinkMe en 3 étapes,
 * feu tricolore, encart réseau, FAQ.
 * Keyword cible : "affiliation sans stock comment ça marche"
 *
 * @module CommentCaMarchePage
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
} from 'lucide-react';
import type { Metadata } from 'next';

import { FaqJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Comment fonctionne LinkMe — Affiliation sans stock',
  description:
    'Choisis tes produits, configure ta marge, partage ton lien. Commission sur chaque vente. Zéro stock, zéro logistique.',
  keywords: [
    'affiliation sans stock',
    "comment fonctionne l'affiliation",
    'plateforme affiliation',
  ],
  openGraph: {
    title: 'Comment fonctionne LinkMe — Affiliation sans stock en 3 étapes',
    description:
      'De la création de ta première sélection à ta première commission, LinkMe fonctionne en 3 étapes. Catalogue multi-marques, marge configurable, lien partageable.',
    url: '/comment-ca-marche',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Comment fonctionne LinkMe',
      },
    ],
  },
  twitter: {
    description:
      'Choisis tes produits, configure ta marge, partage ton lien. Commission sur chaque vente. Zéro stock, zéro logistique.',
  },
  alternates: {
    canonical: '/comment-ca-marche',
  },
};

const MAIN_STEPS = [
  {
    number: '01',
    icon: LayoutGrid,
    title: 'Parcours le catalogue multi-marques',
    description:
      'Explore les produits de toutes les marques sélectionnées sur LinkMe — déco, éclairage, végétal, électronique et plus. Sélectionne ceux qui correspondent à ton univers ou aux besoins de tes clients. Chaque produit a une fiche complète : visuels, description, prix de base fournisseur, marge maximale autorisée.',
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Configure ta marge produit par produit',
    description:
      "Pour chaque produit de ta sélection, fixe ton prix de vente dans la fourchette autorisée. Le système feux tricolores te guide : vert pour vendre vite, orange pour l'équilibre, rouge pour maximiser ta marge unitaire. Tu décides. Pas de règle imposée.",
    color: '#7E84C0',
    bgGradient: 'from-[#7E84C0]/10 to-[#7E84C0]/5',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Partage ta sélection et encaisse',
    description:
      'Ta sélection a son propre lien partageable. Diffuse-la à ton audience, tes clients, ton réseau. Chaque vente générée via ton lien te rapporte ta marge — tracée en temps réel dans ton dashboard.',
    color: '#3976BB',
    bgGradient: 'from-[#3976BB]/10 to-[#3976BB]/5',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Qui gère les commandes et les livraisons ?',
    a: "LinkMe gère tout de A à Z : commandes, expéditions, suivi de livraison, service client, retours, facturation. Tu n'avances pas un centime, tu ne gères jamais un colis, tu ne réponds pas à un client mécontent. Tu te concentres sur ta recommandation.",
  },
  {
    q: 'Combien de temps pour créer ma première sélection ?',
    a: "Moins d'une heure pour une première sélection de 5 à 10 produits. Tu parcours le catalogue, tu sélectionnes ce que tu veux, tu configures ta marge. Le lien est généré immédiatement. Tu peux le partager le jour même.",
  },
  {
    q: 'Est-ce que je peux avoir plusieurs sélections ?',
    a: 'Oui, autant que tu veux. Tu peux créer une sélection par thème, par saison, par projet client, par audience. Chaque sélection a son propre lien et ses propres statistiques. Certains ambassadeurs en gèrent une dizaine en parallèle.',
  },
  {
    q: 'Comment je reçois mes paiements ?',
    a: 'Tes commissions sont virées directement sur ton compte bancaire, à un rythme mensuel par défaut. Tu reçois un récapitulatif clair de tes ventes et commissions. Aucune facture à produire, aucune relance.',
  },
  {
    q: "Qu'est-ce qui se passe si un produit est en rupture de stock ?",
    a: "Le produit en rupture est automatiquement signalé dans ton tableau de bord et masqué dans ta sélection publique. Ton client ne voit pas un produit qu'il ne peut pas commander. Tu es notifié dès que le stock est réapprovisionné.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5DBEBB]/10 via-white to-[#3976BB]/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#183559] leading-tight">
            Simple.{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
              En trois étapes.
            </span>
          </h1>
          <p className="mt-6 text-lg text-[#183559]/70 max-w-2xl mx-auto">
            De la création de ta première sélection à ta première commission.
          </p>
        </div>
      </section>

      {/* Les 3 étapes */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {MAIN_STEPS.map(step => (
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

      {/* Encart réseaux */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#183559] to-[#3976BB] rounded-2xl p-8 lg:p-10 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Vous êtes une enseigne ou un réseau ?
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Le fonctionnement est le même, à l&apos;échelle. La tête de réseau
              configure le catalogue et les taux de commission. Chaque point de
              vente reçoit son propre compte. Déploiement en moins d&apos;une
              semaine.
            </p>
            <Link
              href="/pour-les-enseignes"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-[#183559] bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg"
            >
              Voir la démo réseau
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-white">
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
                className="group bg-gray-50/60 rounded-xl border border-gray-100 open:bg-white open:shadow-sm"
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

      {/* CTA double */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559] via-[#183559] to-[#3976BB]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Prêt à essayer LinkMe ?
          </h2>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-[#183559] bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Demander l&apos;accès
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pour-les-enseignes"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors"
            >
              Voir une démo réseau
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
