/**
 * Page À propos - LinkMe
 *
 * Présentation de LinkMe comme marketplace d'affiliation multi-marques.
 *
 * @module AboutPage
 * @since 2026-01-23
 * @updated 2026-05-13 - LM-MKT-001 : accents.
 * @updated 2026-05-13 - LM-MKT-002 : repositionnement marketplace
 *                       multi-marques, suppression de toute mention
 *                       nominative de marque.
 */

import Link from 'next/link';

import {
  Users,
  Target,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    "LinkMe est une marketplace d'affiliation multi-marques. Catalogue déco, éclairage, végétal, électronique et plus. Pensée pour les créateurs de contenu, les professionnels prescripteurs et les enseignes têtes de réseau.",
  openGraph: {
    title: 'À propos de LinkMe',
    description:
      "Une marketplace d'affiliation ouverte aux marques. Aucun stock, aucune logistique pour les ambassadeurs.",
    url: '/about',
  },
  alternates: {
    canonical: '/about',
  },
};

const VALUES = [
  {
    icon: Target,
    title: 'Transparence',
    description:
      'Prix base fournisseur affiché, marge libre, commission claire. Tu sais exactement ce que tu gagnes sur chaque vente, sur chaque marque.',
  },
  {
    icon: Lightbulb,
    title: 'Simplicité',
    description:
      "Contenu prêt à l'emploi pour chaque produit : visuels optimisés, descriptions, prix recommandés. Tu te concentres sur la recommandation.",
  },
  {
    icon: TrendingUp,
    title: 'Performance',
    description:
      'Analytics multi-marques en temps réel : ventes, clics, conversion par sélection. Tu pilotes ce qui marche, tu ajustes le reste.',
  },
  {
    icon: Users,
    title: 'Partenariat',
    description:
      'Une relation gagnant-gagnant entre ambassadeurs, marques et LinkMe. Aucun engagement, accès sur demande.',
  },
];

const FEATURES = [
  'Catalogue multi-marques (déco, éclairage, végétal, électronique et plus)',
  'Marge libre, configurable produit par produit',
  'Plusieurs sélections adaptées à chaque audience',
  'Intégration multicanale : réseaux sociaux, site web, email',
  'Aucun stock, aucune logistique côté ambassadeur',
  'Paiements simplifiés et sécurisés',
];

export default function AboutPage() {
  return (
    <div className="py-12 lg:py-20">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 lg:mb-24">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#183559] mb-6">
          Une marketplace d&apos;affiliation{' '}
          <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
            ouverte aux marques
          </span>
          .
        </h1>
        <p className="text-lg text-[#183559]/70 max-w-2xl mx-auto">
          LinkMe connecte un catalogue multi-marques à des ambassadeurs
          qualifiés — créateurs de contenu, professionnels prescripteurs,
          enseignes têtes de réseau. Aucun stock, aucune logistique pour
          l&apos;ambassadeur. Toute marque qualifiée peut rejoindre le
          catalogue.
        </p>
      </section>

      {/* Mission */}
      <section className="bg-gradient-to-br from-[#183559] to-[#183559]/90 text-white py-16 lg:py-24 mb-16 lg:mb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Notre vision</h2>
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                L&apos;affiliation traditionnelle est rigide, opaque et réservée
                aux gros acteurs. LinkMe la rouvre : une marketplace où chaque
                ambassadeur choisit ses marques, fixe sa marge et touche une
                vraie commission — sans gérer stock ni logistique.
              </p>
              <ul className="space-y-3">
                {FEATURES.map(feature => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5DBEBB] mt-0.5 flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">
                LinkMe, c&apos;est quoi ?
              </h3>
              <p className="text-white/70 mb-4">
                Trois rôles, une seule plateforme :
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5DBEBB]/20 flex items-center justify-center">
                    <span className="text-[#5DBEBB] font-bold">1</span>
                  </div>
                  <span>Marques sélectionnées qui exposent leur catalogue</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#7E84C0]/20 flex items-center justify-center">
                    <span className="text-[#7E84C0] font-bold">2</span>
                  </div>
                  <span>Ambassadeurs qui créent leurs sélections</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#3976BB]/20 flex items-center justify-center">
                    <span className="text-[#3976BB] font-bold">3</span>
                  </div>
                  <span>
                    LinkMe qui gère logistique, paiements et commission
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 lg:mb-24">
        <h2 className="text-3xl font-bold text-[#183559] text-center mb-12">
          Nos valeurs
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map(value => (
            <div
              key={value.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-[#5DBEBB]/10 flex items-center justify-center mb-4">
                <value.icon className="h-6 w-6 text-[#5DBEBB]" />
              </div>
              <h3 className="text-lg font-semibold text-[#183559] mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-[#183559]/60">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#5DBEBB]/10 to-[#7E84C0]/10 rounded-2xl p-8 lg:p-12 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#183559] mb-4">
            Prêt à devenir ambassadeur ?
          </h2>
          <p className="text-[#183559]/70 mb-8 max-w-xl mx-auto">
            Accès sur demande. On regarde ton profil, on t&apos;ouvre le
            catalogue multi-marques, tu commences à recommander.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5DBEBB] text-white font-semibold rounded-xl hover:bg-[#4CA9A6] transition-colors"
          >
            Demander l&apos;accès
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
