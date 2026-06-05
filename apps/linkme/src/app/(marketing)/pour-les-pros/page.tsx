/**
 * Page « Pour les pros » - LinkMe
 *
 * Landing persona professionnels prescripteurs : architectes
 * d'intérieur, décorateurs, stylistes, consultants HCR, agents immobiliers.
 * Positionnement : commission sur les prescriptions.
 * Keyword cible : "commission sur recommandation"
 *
 * @module PourLesProsPage
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
  title: 'LinkMe pour les pros — Commission sur tes prescriptions',
  description:
    'Architectes, décorateurs, consultants — tes prescriptions méritent une commission. Crée ta sélection LinkMe en 10 minutes.',
  keywords: [
    'devenir ambassadeur de marque',
    'commission sur recommandation',
    'affiliation architecte décorateur',
  ],
  openGraph: {
    title: 'LinkMe pour les pros — Commission sur tes prescriptions',
    description:
      'Architectes, décorateurs, consultants — tes prescriptions méritent une commission. Crée ta sélection LinkMe en 10 minutes.',
    url: '/pour-les-pros',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkMe pour les professionnels',
      },
    ],
  },
  twitter: {
    description:
      'Architectes, décorateurs, consultants — tes prescriptions méritent une commission. Crée ta sélection LinkMe en 10 minutes.',
  },
  alternates: {
    canonical: '/pour-les-pros',
  },
};

const STEPS = [
  {
    number: '01',
    icon: LayoutGrid,
    title: 'Accède au catalogue multi-marques',
    description:
      "On valide ton profil pro et on t'ouvre le catalogue multi-marques — déco, éclairage, végétal, électronique et plus. Tu vois les prix base fournisseur et les marges possibles.",
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Crée une sélection par projet ou client',
    description:
      'Tu identifies les produits que tu veux conseiller. Tu crées une sélection adaptée à chaque projet. Ton client reçoit son lien dans le livrable.',
    color: '#7E84C0',
    bgGradient: 'from-[#7E84C0]/10 to-[#7E84C0]/5',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Ton client commande, tu encaisses',
    description:
      "Ton client passe commande via le lien que tu lui as envoyé. Tu n'avances pas un centime, tu ne gères pas l'expédition. Ta commission arrive directement sur ton compte.",
    color: '#3976BB',
    bgGradient: 'from-[#3976BB]/10 to-[#3976BB]/5',
  },
];

const FOR_WHO = [
  "Architectes d'intérieur",
  'Décorateurs',
  'Stylistes',
  'Consultants hôtels-cafés-restaurants',
  'Agents immobiliers',
  'Tout professionnel qui prescrit des produits à ses clients',
];

const FAQ_ITEMS = [
  {
    q: "Est-ce que mes clients voient que j'utilise LinkMe ?",
    a: "Non, sauf si tu le mentionnes toi-même. La page de sélection porte ton nom et ton univers. Le client voit ta sélection, pas la plateforme qui l'héberge. Tu restes la référence, LinkMe est invisible.",
  },
  {
    q: 'Puis-je créer une sélection différente par projet ou client ?',
    a: "Oui, c'est fait pour ça. Tu crées autant de sélections que tu as de projets ou de clients. Chaque sélection a son propre lien, sa propre mise en page, ses propres produits et marges. Tout est indépendant.",
  },
  {
    q: "Qu'est-ce qui se passe si mon client retourne un produit ?",
    a: "Le retour est géré par LinkMe, pas par toi. Ta commission n'est versée que sur les commandes effectivement livrées et non retournées dans le délai légal. Tu n'as aucune démarche à faire.",
  },
  {
    q: 'Y a-t-il un engagement minimum ou un abonnement ?',
    a: "Non. L'accès est gratuit. Aucun abonnement, aucun minimum de ventes, aucun engagement de durée. Tu utilises LinkMe quand tu en as besoin, tu ne paies rien sinon.",
  },
  {
    q: 'Comment est-ce que je justifie la commission auprès de mes clients ?',
    a: "La plupart du temps, tu n'as pas à le justifier — ton client paie le prix que tu as fixé, et la commission est incluse. Si tu préfères la transparence, tu peux simplement expliquer que tu travailles avec une plateforme multi-marques qui gère la logistique. Certains pros en font même un argument : ils offrent un service complet (sélection + commande + livraison) sans frais supplémentaires pour le client.",
  },
];

export default function PourLesProsPage() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3976BB]/10 via-white to-[#7E84C0]/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#183559] leading-tight">
            Tes prescriptions ont toujours eu de la valeur.{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
              Maintenant elles ont un prix.
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
            Architectes, décorateurs, consultants HCR — tu passes des heures à
            sourcer les bons produits pour tes clients.
            <br />
            <span className="text-[#183559]/60">
              Ils achètent ailleurs. Tu n&apos;en vois pas la couleur.
            </span>
          </p>
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#183559] to-[#3976BB] rounded-2xl p-8 lg:p-10 text-white">
            <h2 className="text-2xl font-bold mb-4">Un exemple concret</h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Un architecte d&apos;intérieur travaille sur 5&nbsp;projets
              simultanément. Pour chaque projet, il crée une sélection LinkMe
              des produits qu&apos;il recommande. Son client reçoit le lien dans
              le livrable. Il commande. L&apos;architecte touche sa commission.
              Sans gérer stock ni livraison.
            </p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Pour qui ?
            </h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {FOR_WHO.map(item => (
              <li
                key={item}
                className="flex items-start gap-3 bg-gray-50/60 rounded-xl p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-[#5DBEBB] mt-0.5 flex-shrink-0" />
                <span className="text-[#183559]/80">{item}</span>
              </li>
            ))}
          </ul>
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
            Tes conseils génèrent déjà des ventes.
            <br />
            Commence à en voir la couleur.
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
