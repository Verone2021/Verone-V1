/**
 * Page « Pour les enseignes » - LinkMe
 *
 * Landing persona enseignes et têtes de réseau.
 * Ton : VOUVOIEMENT (audience B2B enseigne — différent du reste du site).
 * Positionnement : Level 1 actif uniquement (centralisation commandes,
 * catalogue commun, produits sur mesure + fournisseurs extérieurs,
 * visibilité financière). La vente au consommateur final est en roadmap.
 *
 * Source de vérité copy : 2026-05-17_copy-pour-les-enseignes.md
 * + corrections sprint LinkMe Site public (2026-06-03) :
 *   - vouvoiement complet
 *   - Pilier 3 combiné (produits sur mesure + sourcing fournisseurs)
 *   - aucune mention « Vérone » côté public
 *
 * @module PourLesEnseignesPage
 * @since 2026-05-13 - LM-PUB-002
 * @updated 2026-06-05 - LINKME-COPY-001 : vouvoiement, Pilier 3 combiné, no-Vérone.
 */

import Link from 'next/link';

import {
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  ListChecks,
  Package,
  LineChart,
  Inbox,
  Layers,
  EyeOff,
} from 'lucide-react';
import type { Metadata } from 'next';

import { FaqJsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    'LinkMe pour les réseaux — Catalogue, commandes, marges en un seul endroit',
  description:
    'Pokawa et Black & White centralisent leurs commandes réseau et déploient leur catalogue à tout le réseau via LinkMe. Un tableau de bord, tout le réseau.',
  keywords: [
    'gestion catalogue réseau franchisé',
    'plateforme commandes multi-points de vente',
    'affiliation réseau HCR',
    'déploiement catalogue franchise',
  ],
  openGraph: {
    title: 'LinkMe pour les réseaux — Un tableau de bord. Tout votre réseau.',
    description:
      'Centralisez les commandes de tous vos restaurants, déployez un catalogue commun, distribuez vos produits à votre réseau et suivez vos marges en temps réel.',
    url: '/pour-les-enseignes',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkMe pour les réseaux',
      },
    ],
  },
  twitter: {
    description:
      'Vos restaurants commandent. Vous voyez tout en temps réel — commandes, marges, statuts — depuis un seul espace.',
  },
  alternates: {
    canonical: '/pour-les-enseignes',
  },
};

const PAIN_POINTS = [
  {
    icon: Inbox,
    title: 'Commandes dispersées',
    body: 'Chaque restaurant commande de son côté, par email ou téléphone. Consolider les volumes vous prend des heures chaque semaine.',
  },
  {
    icon: Layers,
    title: 'Références incontrôlées',
    body: "Sans catalogue commun, vos restaurants finissent par commander des références différentes d'un point de vente à l'autre. Uniformisation impossible.",
  },
  {
    icon: EyeOff,
    title: 'Zéro visibilité financière',
    body: 'Vous ne savez pas en temps réel ce que votre réseau commande, ce que vous encaissez, ni ce qui est en attente de paiement.',
  },
];

const PILLARS = [
  {
    icon: LayoutGrid,
    color: '#5DBEBB',
    title: 'Toutes les commandes de tous vos restaurants. En un seul endroit.',
    body: "Depuis votre tableau de bord LinkMe, vous voyez l'ensemble des commandes de votre réseau : par restaurant, par statut (en attente, validée, expédiée), par période. Vous filtrez par type de point de vente — succursale ou franchise — et vous suivez le chiffre d'affaires consolidé en temps réel.",
    bullets: [
      "Les réseaux partenaires gèrent l'ensemble de leurs commandes depuis une seule interface.",
    ],
    eyebrow: 'Pilier 1 — Centralisation des commandes',
  },
  {
    icon: ListChecks,
    color: '#7E84C0',
    title: 'Un catalogue partagé. Vos références. Vos conditions.',
    body: "Vous créez une sélection de produits une seule fois. Vous la partagez à l'ensemble de votre réseau. Chaque restaurant commande depuis ce même catalogue — avec vos références, vos produits, votre charte. Vous configurez votre marge par produit. Vos points de vente ne négocient pas, ne comparent pas, ne cherchent pas : ils commandent ce que vous avez validé.",
    bullets: [
      'Uniformisation garantie des références à travers le réseau',
      'Contrôle total sur les produits autorisés',
      'Marges configurées une fois, appliquées partout',
    ],
    eyebrow: 'Pilier 2 — Sélection commune pour tout le réseau',
  },
  {
    icon: Package,
    color: '#3976BB',
    title: 'Développez vos produits sur mesure. Distribuez-les à votre réseau.',
    body: 'Concevez vos propres références — mobilier à votre image, PLV, accessoires brandés — et intégrez aussi vos fournisseurs extérieurs directement dans votre sélection LinkMe. Chaque restaurant commande le tout depuis la même interface. Vous gardez la main sur les prix, les stocks et la disponibilité.',
    bullets: [
      'Deux modes logistiques : stocké en entrepôt LinkMe (expédition directe) ou envoi par votre fournisseur à chaque commande.',
      'Vous soumettez le produit (photo, référence, prix HT). LinkMe valide sous 48h et le rend disponible à votre réseau.',
      'Sur chaque vente, LinkMe prend une commission de plateforme variable. Vous — ou votre fournisseur — encaissez le reste.',
    ],
    eyebrow: 'Pilier 3 — Vos produits, vos fournisseurs, votre réseau',
  },
  {
    icon: LineChart,
    color: '#5DBEBB',
    title: 'Vous savez ce que vous encaissez. Avant la fin du mois.',
    body: "Votre tableau de bord affiche à la minute : commissions totales, payables, en cours, en attente. L'évolution du chiffre d'affaires de votre réseau depuis l'ouverture. Les 5 produits qui performent le mieux. Plus de réconciliation manuelle. Plus de surprise en fin de trimestre.",
    bullets: [],
    eyebrow: 'Pilier 4 — Visibilité financière en temps réel',
  },
];

const DEPLOYMENT_STEPS = [
  {
    number: '01',
    title: 'Démo réseau (30 min)',
    body: "On vous explique comment Pokawa et d'autres réseaux utilisent LinkMe. Vous posez vos questions. On adapte à votre structure.",
  },
  {
    number: '02',
    title: 'Configuration du compte enseigne',
    body: 'On crée votre accès admin. Vous importez vos restaurants (nom, adresse, type succursale/franchise). Vous accédez à votre tableau de bord.',
  },
  {
    number: '03',
    title: 'Construction de votre sélection',
    body: 'Vous parcourez le catalogue LinkMe, vous sélectionnez les références adaptées à votre réseau, vous configurez votre marge pour chaque produit.',
  },
  {
    number: '04',
    title: 'Intégration de vos produits et fournisseurs (optionnel)',
    body: 'Vous avez des produits sur mesure ou des fournisseurs extérieurs ? Soumettez-les (référence, prix HT, mode logistique). Validation en 48h. Disponibles immédiatement à la commande pour vos restaurants.',
  },
  {
    number: '05',
    title: 'Déploiement',
    body: 'Vous partagez le lien de votre sélection à vos restaurants. Ils commandent. Vous voyez tout.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Est-ce que mes restaurants voient les prix que je configure ou le prix fournisseur ?',
    a: 'Ils voient uniquement le prix que vous configurez. Le prix fournisseur et votre marge ne sont visibles que depuis votre compte admin.',
  },
  {
    q: 'Est-ce que je peux avoir des marges différentes par restaurant ou par type de point de vente ?',
    a: "Aujourd'hui, la marge est configurée au niveau de la sélection (applicable à tout le réseau). La gestion par point de vente arrive avec la prochaine étape de la plateforme.",
  },
  {
    q: 'Comment fonctionne la validation des commandes ?',
    a: 'Les commandes passées par vos restaurants sont d’abord validées par LinkMe. Une fois validées, elles partent en préparation. Vous suivez le statut en temps réel.',
  },
  {
    q: 'Est-ce que LinkMe gère la livraison ?',
    a: "Oui. La logistique est gérée par LinkMe. Vos restaurants reçoivent directement. Vous n'intervenez pas dans la chaîne logistique.",
  },
  {
    q: "Quel est le coût pour l'enseigne ?",
    a: "L'accès à la plateforme est gratuit. LinkMe prend une commission sur les ventes générées — variable selon le type de produit (catalogue public ou produit utilisateur). Détails en démo.",
  },
  {
    q: "Est-ce qu'on peut intégrer des produits hors catalogue LinkMe ?",
    a: 'Oui. Vous pouvez développer vos propres produits ou intégrer un fournisseur extérieur. LinkMe valide en 48h. Deux options logistiques : le produit est stocké en entrepôt LinkMe (expédition directe) ou votre fournisseur est notifié à chaque commande et expédie lui-même. Sur chaque vente, LinkMe prend une commission de plateforme variable.',
  },
];

export default function PourLesEnseignesPage(): JSX.Element {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />

      {/* SECTION 1 — HERO */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559]/8 via-white to-[#5DBEBB]/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7E84C0]/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#7E84C0] rounded-full" />
            <span className="text-sm font-medium text-[#7E84C0]">
              Pokawa · Black &amp; White · et d&apos;autres réseaux
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#183559] leading-tight">
            Un tableau de bord.{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
              Tout votre réseau.
            </span>
          </h1>
          <p className="mt-6 text-lg text-[#183559]/70 max-w-2xl mx-auto leading-relaxed">
            Vos restaurants commandent. Vous voyez tout en temps réel —
            commandes, marges, statuts — depuis un seul espace. Plus besoin de
            consolider les infos restaurant par restaurant.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?type=enseigne"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-xl hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Demander une démo réseau
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

      {/* SECTION 2 — PROBLÈME */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Ce que ça coûte de gérer un réseau sans outil adapté.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PAIN_POINTS.map(pain => (
              <div
                key={pain.title}
                className="bg-gray-50/60 rounded-2xl p-6 border border-gray-100"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#183559]/8 mb-4">
                  <pain.icon className="h-5 w-5 text-[#183559]" />
                </span>
                <h3 className="text-lg font-bold text-[#183559] mb-2">
                  {pain.title}
                </h3>
                <p className="text-sm text-[#183559]/70 leading-relaxed">
                  {pain.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — SOLUTION (4 piliers) */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#5DBEBB]/10 rounded-full text-sm font-medium text-[#5DBEBB] mb-4">
              La solution, aujourd&apos;hui
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Ce que LinkMe fait pour vous.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {PILLARS.map(pillar => (
              <article
                key={pillar.eyebrow}
                className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl"
                    style={{ backgroundColor: `${pillar.color}1A` }}
                  >
                    <pillar.icon
                      className="h-6 w-6"
                      style={{ color: pillar.color }}
                    />
                  </span>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: pillar.color }}
                  >
                    {pillar.eyebrow}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#183559] mb-3 leading-snug">
                  {pillar.title}
                </h3>
                <p className="text-sm text-[#183559]/70 leading-relaxed mb-4">
                  {pillar.body}
                </p>
                {pillar.bullets.length > 0 && (
                  <ul className="space-y-2">
                    {pillar.bullets.map(bullet => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm text-[#183559]/70"
                      >
                        <CheckCircle2
                          className="h-4 w-4 mt-0.5 flex-shrink-0"
                          style={{ color: pillar.color }}
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — DÉPLOIEMENT (5 étapes) */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              De zéro à tout le réseau. En une semaine.
            </h2>
          </div>
          <ol className="space-y-4">
            {DEPLOYMENT_STEPS.map(step => (
              <li
                key={step.number}
                className="flex gap-5 bg-gray-50/60 rounded-2xl p-5 lg:p-6 border border-gray-100"
              >
                <span className="flex-shrink-0 w-12 h-12 rounded-full bg-[#5DBEBB]/10 text-[#5DBEBB] font-bold text-lg flex items-center justify-center">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#183559] mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#183559]/70 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SECTION 5 — ROADMAP (Level 2 — 2 phrases discrètes) */}
      <section className="py-12 lg:py-16 bg-gray-50/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 bg-[#7E84C0]/10 rounded-full text-xs font-semibold uppercase tracking-wider text-[#7E84C0] mb-4">
            Et après ?
          </span>
          <p className="text-base text-[#183559]/70 leading-relaxed">
            Aujourd&apos;hui, LinkMe gère la tête de réseau : commandes
            centralisées, catalogue commun, intégration de vos produits et
            fournisseurs. La prochaine étape — prévue prochainement — donnera à
            chaque point de vente son propre espace : sa sélection, ses
            commissions, son tableau de bord individuel. Elle inclura aussi la
            vente au consommateur final : vos points de vente pourront proposer
            vos produits brandés directement à leurs clients. Les enseignes
            partenaires actuelles auront accès en priorité.
          </p>
        </div>
      </section>

      {/* SECTION 6 — PREUVE SOCIALE */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Ils ont déjà déployé.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-gray-50/60 rounded-2xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-[#183559] tracking-tight">
                Pokawa
              </span>
              <p className="mt-3 text-sm text-[#183559]/60 leading-relaxed">
                Réseau de restauration rapide. Plusieurs dizaines de points de
                vente. Utilise LinkMe pour centraliser les commandes produits et
                distribuer son mobilier brandé au réseau.
              </p>
            </div>
            <div className="bg-gray-50/60 rounded-2xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-[#183559] tracking-tight">
                Black &amp; White
              </span>
              <p className="mt-3 text-sm text-[#183559]/60 leading-relaxed">
                Enseigne multi-sites. Déploiement catalogue produit et suivi
                centralisé des commandes via LinkMe.
              </p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link
              href="/contact?type=enseigne"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#5DBEBB] hover:text-[#4CA9A6] transition-colors"
            >
              Demander une démo réseau
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7 — FAQ */}
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
          <p className="text-center text-sm text-[#183559]/50 mt-8">
            Vous avez une question qui n&apos;est pas listée ?{' '}
            <Link
              href="/contact?type=enseigne"
              className="text-[#5DBEBB] font-semibold hover:text-[#4CA9A6]"
            >
              Posez-la en démo
            </Link>
            .
          </p>
        </div>
      </section>

      {/* SECTION 8 — CTA FINAL */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559] via-[#183559] to-[#3976BB]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Votre réseau mérite mieux qu&apos;un tableur.
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Démo personnalisée. Configuration en une semaine. Aucun engagement
            au départ.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?type=enseigne"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-[#183559] bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Demander une démo réseau
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/comment-ca-marche"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors"
            >
              Lire comment ça marche
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-6 text-white/50 text-sm">
            On vous rappelle sous 24h.
          </p>
        </div>
      </section>
    </>
  );
}
