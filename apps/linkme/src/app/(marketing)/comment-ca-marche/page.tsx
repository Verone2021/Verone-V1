/**
 * Page « Comment ça marche » - LinkMe
 *
 * Explication détaillée du fonctionnement de LinkMe en 3 étapes,
 * du feu tricolore, des commandes / paiement et de ce que LinkMe
 * prend en charge pour l'ambassadeur. Aucune mention de marque.
 *
 * @module CommentCaMarchePage
 * @since 2026-05-13
 */

import Link from 'next/link';

import {
  ArrowRight,
  LayoutGrid,
  SlidersHorizontal,
  Share2,
  Truck,
  Headphones,
  FileText,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comment fonctionne LinkMe — Affiliation produit physique',
  description:
    'Catalogue multi-marques, marge configurable, lien partageable. Voilà comment LinkMe fonctionne en 3 étapes.',
  openGraph: {
    title: 'Comment fonctionne LinkMe — Affiliation produit physique',
    description:
      'Tu choisis tes produits, tu fixes ta marge, tu partages ton lien. LinkMe gère la logistique, le service client, la facturation.',
    url: '/comment-ca-marche',
  },
  alternates: {
    canonical: '/comment-ca-marche',
  },
};

const MAIN_STEPS = [
  {
    number: '01',
    icon: LayoutGrid,
    title: 'Accède au catalogue',
    description:
      "Une fois ton accès validé, tu vois l'intégralité du catalogue multi-marques. Chaque produit a son prix base fournisseur, ses visuels prêts à l'emploi et sa fiche détaillée.",
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Configure ta marge',
    description:
      'Pour chaque produit de ta sélection, tu fixes la marge que tu veux ajouter au prix base fournisseur. Notre feu tricolore te guide pour rester compétitif sans casser ta rentabilité.',
    color: '#7E84C0',
    bgGradient: 'from-[#7E84C0]/10 to-[#7E84C0]/5',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Partage et touche ta commission',
    description:
      'Ton lien est unique et traçable. Quand un client commande via ce lien, LinkMe gère la commande de A à Z et tu touches ta marge — automatiquement, sans facture à produire.',
    color: '#3976BB',
    bgGradient: 'from-[#3976BB]/10 to-[#3976BB]/5',
  },
];

const LINKME_HANDLES = [
  {
    icon: Truck,
    title: 'Logistique',
    description:
      "Préparation, expédition, suivi de commande. Le client reçoit son produit sans que tu n'aies à intervenir.",
  },
  {
    icon: Headphones,
    title: 'Service client',
    description:
      "Questions avant achat, suivi de commande, retours, SAV. L'équipe LinkMe gère, tu restes recommandeur, pas vendeur.",
  },
  {
    icon: FileText,
    title: 'Facturation',
    description:
      'Le client reçoit une facture conforme. Tu reçois un récapitulatif mensuel clair de tes commissions, prêt pour ta compta.',
  },
  {
    icon: CreditCard,
    title: 'Paiement de ta commission',
    description:
      'Versement de ta marge directement sur ton compte bancaire, à un rythme régulier. Aucune relance, aucune paperasse.',
  },
];

const FAQ = [
  {
    q: 'Combien je touche par vente ?',
    a: 'Tu fixes ta marge librement entre une fourchette minimale et maximale dépendant du produit. Concrètement, tu peux choisir entre 15 % et 35 % selon les marques et catégories. Tu vois ton gain estimé en temps réel.',
  },
  {
    q: 'Je dois payer pour utiliser LinkMe ?',
    a: 'Non. L’accès est gratuit pour l’ambassadeur. LinkMe se rémunère via une commission de 5 % calculée sur la vente, pas sur ta marge.',
  },
  {
    q: 'Que se passe-t-il si un client retourne un produit ?',
    a: "Le retour est géré par LinkMe. Ta commission n'est versée que sur les commandes effectivement livrées et non retournées dans le délai légal.",
  },
  {
    q: 'Combien de temps pour avoir un accès ?',
    a: "On regarde chaque demande individuellement, en général sous 5 jours ouvrés. On revient vers toi avec un OK et un onboarding express, ou on t'explique pourquoi ce n'est pas le moment.",
  },
];

export default function CommentCaMarchePage(): JSX.Element {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5DBEBB]/10 via-white to-[#3976BB]/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#183559] leading-tight">
            Le fonctionnement de LinkMe en{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
              3 étapes
            </span>
            .
          </h1>
          <p className="mt-6 text-lg text-[#183559]/70 max-w-2xl mx-auto">
            LinkMe est une marketplace d&apos;affiliation multi-marques. Tu
            choisis tes produits dans un catalogue ouvert (déco, éclairage,
            végétal, électronique et plus), tu fixes ta marge, tu partages ton
            lien. LinkMe s&apos;occupe du reste.
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

      {/* Feu tricolore */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Le feu tricolore
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              Pour chaque produit, on t&apos;affiche une jauge visuelle qui te
              guide vers le bon équilibre prix-marché et marge.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <span className="w-4 h-4 rounded-full bg-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#183559] mb-1">
                    Zone verte — Compétitif
                  </h3>
                  <p className="text-sm text-[#183559]/60">
                    Tu restes nettement sous le prix marché. Conversion
                    optimale, volume au rendez-vous.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-4 h-4 rounded-full bg-orange-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#183559] mb-1">
                    Zone orange — Équilibré
                  </h3>
                  <p className="text-sm text-[#183559]/60">
                    Bon compromis marge / volume. Tu gardes une marge
                    confortable sans freiner la conversion.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-4 h-4 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#183559] mb-1">
                    Zone rouge — Élevé
                  </h3>
                  <p className="text-sm text-[#183559]/60">
                    Tu maximises ta marge, le volume risque de baisser. À
                    réserver aux produits exclusifs ou aux audiences très
                    qualifiées.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commandes et paiement */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Les commandes et le paiement
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              Tu n&apos;avances rien, tu ne factures personne, tu ne gères aucun
              colis.
            </p>
          </div>

          <ol className="space-y-4">
            {[
              'Ton client commande via ton lien. Il paie directement sur LinkMe.',
              'LinkMe prélève sa commission de 5 % et la TVA applicable.',
              "L'expédition est lancée immédiatement par la marque sélectionnée. Le suivi est partagé avec le client.",
              'Ta marge est versée sur ton compte bancaire selon le rythme convenu (mensuel par défaut).',
            ].map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-4 bg-gray-50/60 rounded-xl p-4"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5DBEBB]/15 text-[#5DBEBB] font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-[#183559]/80 leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Ce que LinkMe fait pour toi */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
              Ce que LinkMe fait pour toi
            </h2>
            <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
              Tu n&apos;as ni stock, ni service client, ni facturation à gérer.
              Tu te concentres sur ta recommandation.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LINKME_HANDLES.map(it => (
              <div
                key={it.title}
                className="bg-white rounded-2xl p-6 border border-gray-100"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5DBEBB]/10 flex items-center justify-center mb-4">
                  <it.icon className="h-6 w-6 text-[#5DBEBB]" />
                </div>
                <h3 className="text-base font-semibold text-[#183559] mb-2">
                  {it.title}
                </h3>
                <p className="text-sm text-[#183559]/60 leading-relaxed">
                  {it.description}
                </p>
              </div>
            ))}
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
            {FAQ.map(item => (
              <details
                key={item.q}
                className="group bg-gray-50/60 rounded-xl border border-gray-100 open:bg-white open:shadow-sm"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none p-5 font-semibold text-[#183559]">
                  <span>{item.q}</span>
                  <CheckCircle2 className="h-5 w-5 text-[#5DBEBB] transition-transform group-open:rotate-45" />
                </summary>
                <p className="px-5 pb-5 text-sm text-[#183559]/70 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#183559] via-[#183559] to-[#3976BB]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Prêt à essayer LinkMe ?
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
            Accès sur demande. Tu remplis ton profil, on regarde, on
            t&apos;ouvre le catalogue.
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
