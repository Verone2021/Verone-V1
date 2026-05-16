/**
 * Page « Pour les enseignes » - LinkMe
 *
 * Landing persona enseignes et réseaux de franchisés.
 * Ton : vouvoiement (B2B sérieux).
 * Keyword cible : "programme revendeur réseau"
 *
 * @module PourLesEnseignesPage
 * @since 2026-05-13 - LM-PUB-002
 */

import Link from 'next/link';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

import { FaqJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'LinkMe pour les enseignes — Déployez un catalogue produit',
  description:
    "LinkMe déploie un catalogue multi-marques à tout votre réseau en moins d'une semaine. Dashboard central, commissions tracées.",
  openGraph: {
    title:
      'LinkMe pour les enseignes — Déployez un catalogue produit à votre réseau',
    description:
      "LinkMe déploie un catalogue multi-marques à tout votre réseau de franchisés en moins d'une semaine. Dashboard central, commissions tracées, zéro stock.",
    url: '/pour-les-enseignes',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkMe pour les enseignes',
      },
    ],
  },
  alternates: {
    canonical: '/pour-les-enseignes',
  },
};

const SOLUTION_STEPS = [
  {
    number: '01',
    title: 'La tête de réseau configure le catalogue et les taux de commission',
    description:
      'Vous choisissez les produits que votre réseau peut proposer et définissez les règles de commission pour chaque point de vente.',
    color: '#5DBEBB',
  },
  {
    number: '02',
    title: 'Chaque point de vente reçoit son compte et sa page de sélection',
    description:
      'Chaque franchisé ou affilié dispose de son propre espace LinkMe, avec sa page personnalisée et ses propres liens de partage.',
    color: '#7E84C0',
  },
  {
    number: '03',
    title: 'Les clients commandent via les pages de sélection',
    description:
      'Vos clients finaux parcourent les sélections de vos points de vente et commandent directement. LinkMe gère logistique, paiement et service client.',
    color: '#3976BB',
  },
  {
    number: '04',
    title: 'La tête de réseau pilote tout depuis le tableau de bord central',
    description:
      'Commissions agrégées, performances par point de vente, produits les plus vendus. Une seule vue pour tout piloter.',
    color: '#5DBEBB',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Combien de points de vente puis-je gérer depuis un seul compte ?',
    a: "Il n'y a pas de limite au nombre de points de vente. Que vous gériez 5 franchisés ou 200 restaurants, l'architecture est la même. La tête de réseau voit tout depuis un tableau de bord unique, chaque point de vente ne voit que ses propres données.",
  },
  {
    q: 'Est-ce que chaque point de vente peut personnaliser sa sélection ?',
    a: "Oui, dans le périmètre que vous définissez. La tête de réseau fixe le catalogue autorisé et les règles de commission. À l'intérieur de ce périmètre, chaque point de vente peut choisir quels produits mettre en avant et comment présenter sa sélection.",
  },
  {
    q: 'Comment les commissions sont-elles réparties entre le point de vente et la tête de réseau ?',
    a: 'Vous définissez la structure de commission au moment de la configuration : une part pour le point de vente qui génère la vente, une part pour la tête de réseau si vous le souhaitez. Tout est paramétrable et visible dans le tableau de bord central.',
  },
  {
    q: 'Y a-t-il un engagement ou un abonnement minimum ?',
    a: 'La démonstration est sans engagement. Une fois que vous décidez de déployer, nous définissons ensemble les conditions adaptées à la taille de votre réseau. Contactez-nous pour en discuter.',
  },
  {
    q: 'Comment se déroule la démonstration ?',
    a: 'On vous appelle sous 24h. On vous montre le tableau de bord central en live, on configure votre premier point de vente fictif, et on répond à toutes vos questions. La démo dure environ 30 minutes. Aucune préparation requise de votre part.',
  },
];

export default function PourLesEnseignesPage() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559]/8 via-white to-[#5DBEBB]/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7E84C0]/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#7E84C0] rounded-full" />
            <span className="text-sm font-medium text-[#7E84C0]">
              Démo disponible
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#183559] leading-tight">
            Votre réseau de points de vente,{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
              transformé en réseau de revente.
            </span>
          </h1>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-xl hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Demander une démo
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

      {/* Social proof — typographique, sans images */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[#183559]/50 text-sm font-medium uppercase tracking-widest mb-8">
            Ils utilisent déjà LinkMe pour leur réseau
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-[#183559] tracking-tight">
                Pokawa
              </span>
              <p className="mt-3 text-sm text-[#183559]/50">
                Réseau de restaurants — catalogue produit déployé sur tout le
                réseau
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-[#183559] tracking-tight">
                Black &amp; White
              </span>
              <p className="mt-3 text-sm text-[#183559]/50">
                Enseigne multi-sites — commissions tracées par point de vente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problème */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559] mb-6">
            Votre réseau a une clientèle captive.
            <br />
            <span className="text-[#183559]/50">
              Pas de catalogue à lui proposer.
            </span>
          </h2>
          <p className="text-lg text-[#183559]/70 leading-relaxed max-w-2xl mx-auto">
            Vos franchisés ou affiliés voient des clients tous les jours. Ces
            clients font confiance à votre enseigne. Mais votre catalogue est
            limité à ce que vous avez en stock. Chaque vente complémentaire qui
            pourrait exister ne se fait pas.
          </p>
        </div>
      </section>

      {/* Solution — 4 étapes */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#5DBEBB]/10 rounded-full text-sm font-medium text-[#5DBEBB] mb-4">
              La solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Comment ça fonctionne pour un réseau
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SOLUTION_STEPS.map(step => (
              <div
                key={step.number}
                className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <span
                  className="text-4xl font-bold absolute top-4 right-5"
                  style={{ color: `${step.color}30` }}
                >
                  {step.number}
                </span>
                <h3 className="text-base font-bold text-[#183559] mb-3 pr-10">
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

      {/* Tableau de bord central — mockup CSS */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Tableau de bord central
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              Une vue complète sur l&apos;activité de votre réseau : ventes
              agrégées, commissions par point de vente, produits les plus
              vendus, performances comparées.
            </p>
          </div>
          {/* Mockup CSS — remplacé par capture réelle quand disponible */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
            {/* Barre de navigation fictive */}
            <div className="bg-[#183559] px-6 py-4 flex items-center gap-4">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white/10 rounded px-3 py-1 text-xs text-white/50">
                linkme.io / dashboard / réseau
              </div>
            </div>
            {/* Contenu mockup */}
            <div className="p-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Ventes ce mois', value: '1 247', color: '#5DBEBB' },
                  {
                    label: 'Commissions totales',
                    value: '18 490 €',
                    color: '#7E84C0',
                  },
                  {
                    label: 'Points de vente actifs',
                    value: '34 / 40',
                    color: '#3976BB',
                  },
                  {
                    label: 'Produit n°1',
                    value: 'Lampe Oslo',
                    color: '#5DBEBB',
                  },
                ].map(kpi => (
                  <div
                    key={kpi.label}
                    className="bg-white rounded-xl p-4 border border-gray-100"
                  >
                    <p className="text-xs text-[#183559]/40 mb-1">
                      {kpi.label}
                    </p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: kpi.color }}
                    >
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
              {/* Liste points de vente fictifs */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between text-xs font-medium text-[#183559]/40">
                  <span>Point de vente</span>
                  <span>Ventes</span>
                  <span className="hidden sm:block">Commission</span>
                </div>
                {[
                  { name: 'Paris 11e', ventes: '312', commission: '4 680 €' },
                  {
                    name: 'Lyon Part-Dieu',
                    ventes: '287',
                    commission: '4 305 €',
                  },
                  {
                    name: 'Bordeaux Centre',
                    ventes: '204',
                    commission: '3 060 €',
                  },
                ].map(pdv => (
                  <div
                    key={pdv.name}
                    className="px-4 py-3 flex justify-between items-center text-sm border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium text-[#183559]">
                      {pdv.name}
                    </span>
                    <span className="text-[#183559]/60">{pdv.ventes}</span>
                    <span className="hidden sm:block text-[#5DBEBB] font-semibold">
                      {pdv.commission}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-[#183559]/30 mt-4">
            Interface illustrative — données fictives à des fins de
            démonstration.
          </p>
        </div>
      </section>

      {/* Argument délai */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#5DBEBB]/10 to-[#7E84C0]/10 rounded-2xl p-8 lg:p-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559] mb-4">
              Opérationnel en moins d&apos;une semaine.
            </h2>
            <p className="text-lg text-[#183559]/70 max-w-xl mx-auto">
              Vous configurez le catalogue. Nous activons les comptes. Vos
              points de vente reçoivent leurs accès. En moins de 7&nbsp;jours,
              votre réseau peut commencer à vendre.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              {[
                'Jour 1 — Configuration catalogue',
                'Jour 2-3 — Activation des comptes',
                'Jour 4-7 — Déploiement réseau',
              ].map(step => (
                <div
                  key={step}
                  className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-gray-100"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#5DBEBB] flex-shrink-0" />
                  <span className="text-[#183559]/70">{step}</span>
                </div>
              ))}
            </div>
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

      {/* CTA final */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559] via-[#183559] to-[#3976BB]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Votre réseau peut commencer à vendre cette semaine.
          </h2>
          <div className="mt-10">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-[#183559] bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Demander une démo
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-4 text-white/50 text-sm">
              On vous rappelle sous 24h.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
