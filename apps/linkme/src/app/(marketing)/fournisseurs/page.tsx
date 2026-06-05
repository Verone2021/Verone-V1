/**
 * Page « Pour les fournisseurs » - LinkMe
 *
 * Landing fournisseurs / marques qui veulent référencer leur catalogue.
 * Ton : vouvoiement (B2B).
 * Keyword cible : "référencer catalogue affiliation"
 *
 * @module PourLesFournisseursPage
 * @since 2026-05-15 - LM-SEO-NAV-BLOG-001
 */

import Link from 'next/link';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'LinkMe pour les fournisseurs — Exposez votre catalogue',
  description:
    "Référencez vos produits sur LinkMe et accédez à un réseau d'ambassadeurs qualifiés. Commission transparente sur chaque vente.",
  openGraph: {
    title: 'LinkMe pour les fournisseurs — Exposez votre catalogue',
    description:
      "Référencez vos produits sur LinkMe et accédez à un réseau d'ambassadeurs qualifiés. Commission transparente sur chaque vente.",
    url: '/fournisseurs',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkMe pour les fournisseurs',
      },
    ],
  },
  alternates: {
    canonical: '/fournisseurs',
  },
};

const BENEFITS = [
  {
    title: 'Réseau qualifié',
    description:
      'Vos produits sont recommandés par des enseignes, des prescripteurs professionnels et des créateurs de contenu sélectionnés. Pas de gros affiliés génériques.',
  },
  {
    title: 'Deux modes logistiques au choix',
    description:
      'Vous gérez vous-même les expéditions à chaque commande, ou LinkMe prend en charge le stockage et l’envoi depuis son entrepôt. Dans les deux cas, LinkMe gère la prise de commande, le paiement et la coordination avec l’ambassadeur.',
  },
  {
    title: 'Commission transparente',
    description:
      "Vous fixez votre prix de base. La commission est calculée sur la marge ajoutée par l'ambassadeur. Aucune surprise, aucun frais caché.",
  },
  {
    title: 'Visibilité multi-canaux',
    description:
      "Vos produits apparaissent dans les sélections d'ambassadeurs sur leurs réseaux sociaux, leurs sites web, leurs pages projet client. Diffusion organique.",
  },
];

const STEPS = [
  {
    number: '01',
    title: 'On échange sur votre catalogue',
    description:
      'Visioconférence courte pour comprendre votre offre, votre prix de base et la marge maximale que vous laissez aux ambassadeurs.',
  },
  {
    number: '02',
    title: 'On référence vos produits',
    description:
      'Notre équipe importe votre catalogue avec visuels, descriptions et règles de marge. Vous validez avant publication.',
  },
  {
    number: '03',
    title: 'Vos produits sont disponibles',
    description:
      'Les ambassadeurs sélectionnent vos produits dans leur catalogue, fixent leur marge et partagent leurs sélections. Chaque vente vous est notifiée.',
  },
];

export default function PourLesFournisseursPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559]/8 via-white to-[#5DBEBB]/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5DBEBB]/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#5DBEBB] rounded-full" />
            <span className="text-sm font-medium text-[#5DBEBB]">
              Référencement gratuit
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#183559] mb-6 leading-tight">
            Vos produits méritent un réseau d&apos;ambassadeurs qualifiés.
          </h1>

          <p className="text-lg md:text-xl text-[#183559]/70 max-w-3xl mx-auto leading-relaxed">
            LinkMe vous met en relation avec des enseignes, des prescripteurs et
            des créateurs sélectionnés qui recommandent vos produits à leur
            audience. Vous restez maître de votre prix et de votre stock.
          </p>

          <div className="mt-10">
            <Link
              href="/contact?type=fournisseur"
              className="inline-flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Référencer mon catalogue
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#183559] text-center mb-12">
            Ce que LinkMe apporte aux fournisseurs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {BENEFITS.map(benefit => (
              <div
                key={benefit.title}
                className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-[#5DBEBB] flex-shrink-0 mt-0.5" />
                  <h3 className="text-xl font-semibold text-[#183559]">
                    {benefit.title}
                  </h3>
                </div>
                <p className="text-[#183559]/70 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#183559] text-center mb-12">
            Comment ça se passe
          </h2>

          <div className="space-y-8">
            {STEPS.map(step => (
              <div
                key={step.number}
                className="flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="text-5xl font-bold text-[#5DBEBB]/30 flex-shrink-0 md:w-24">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#183559] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[#183559]/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#183559] to-[#183559]/90">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à exposer votre catalogue ?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            On vous rappelle sous 24h pour discuter de votre offre.
          </p>
          <Link
            href="/contact?type=fournisseur"
            className="inline-flex items-center gap-2 px-6 py-3 text-[#183559] bg-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Référencer mon catalogue
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
