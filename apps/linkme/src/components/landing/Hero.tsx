'use client';

/**
 * Landing Page Hero Section - LinkMe
 *
 * Section hero avec:
 * - Titre accrocheur avec gradient
 * - Sous-titre explicatif
 * - 2 CTAs (Devenir partenaire + En savoir plus)
 * - Logos partenaires (Trusted by)
 * - Statistiques en temps réel depuis Supabase
 * - Illustration/Image
 *
 * @module LandingHero
 * @since 2026-01-07
 * @updated 2026-01-23 - Utilisation de vraies stats via usePublicStats
 */

import Link from 'next/link';

import { ArrowRight, TrendingUp, Users, Wallet, Loader2 } from 'lucide-react';

import {
  usePublicStats,
  formatPublicStat,
  formatPublicAmount,
} from '@/lib/hooks/use-public-stats';

export function LandingHero() {
  const { data: stats, isLoading } = usePublicStats();

  // Stats à afficher avec vraies données ou fallback
  const displayStats = [
    {
      label: 'Affilies actifs',
      value: stats ? formatPublicStat(stats.totalAffiliates) : '-',
      icon: Users,
    },
    {
      label: 'Commissions versees',
      value: stats ? `${formatPublicAmount(stats.totalCommissionsPaid)}€` : '-',
      icon: Wallet,
    },
    {
      label: 'Selections creees',
      value: stats ? formatPublicStat(stats.totalSelections) : '-',
      icon: TrendingUp,
    },
  ];

  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7E84C0]/10 via-white to-[#5DBEBB]/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5DBEBB]/10 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#5DBEBB] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#5DBEBB]">
                Plateforme d&apos;affiliation B2B
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#183559] leading-tight">
              Monetisez votre{' '}
              <span className="bg-gradient-to-r from-[#5DBEBB] via-[#7E84C0] to-[#3976BB] bg-clip-text text-transparent">
                reseau
              </span>{' '}
              avec LinkMe
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg text-[#183559]/70 max-w-xl mx-auto lg:mx-0">
              Rejoignez notre plateforme d&apos;affiliation et gagnez des
              commissions sur chaque vente. Suivi en temps reel, paiements
              simplifies.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-xl hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                Devenir partenaire
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-[#183559] border-2 border-[#183559]/20 rounded-xl hover:bg-[#183559]/5 transition-colors"
              >
                En savoir plus
              </Link>
            </div>

            {/* Stats - Vraies données depuis Supabase */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              {displayStats.map(stat => (
                <div
                  key={stat.label}
                  className="text-center lg:text-left p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100"
                >
                  <stat.icon className="h-5 w-5 text-[#5DBEBB] mx-auto lg:mx-0 mb-1" />
                  <div className="text-2xl font-bold text-[#183559]">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-xs text-[#183559]/60">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Trusted by */}
            <div className="mt-10">
              <p className="text-sm text-[#183559]/50 mb-4">
                Ils nous font confiance
              </p>
              <div className="flex items-center gap-6 justify-center lg:justify-start opacity-60">
                <div className="h-8 px-4 py-1 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">
                    POKAWA
                  </span>
                </div>
                <div className="h-8 px-4 py-1 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">
                    BLACK & WHITE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative lg:pl-8">
            <div className="relative">
              {/* Main illustration container */}
              <div className="aspect-square max-w-md mx-auto lg:max-w-none bg-gradient-to-br from-[#7E84C0]/20 via-[#5DBEBB]/10 to-[#3976BB]/20 rounded-3xl p-8 shadow-2xl">
                {/* Dashboard mockup */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
                  {/* Mockup header */}
                  <div className="h-8 bg-gray-100 flex items-center px-3 gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  {/* Mockup content */}
                  <div className="p-4 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="h-16 bg-gradient-to-br from-[#5DBEBB]/10 to-[#5DBEBB]/5 rounded-lg p-2"
                        >
                          <div className="h-2 w-8 bg-[#5DBEBB]/30 rounded mb-1" />
                          <div className="h-4 w-12 bg-[#183559]/20 rounded" />
                        </div>
                      ))}
                    </div>
                    {/* Chart placeholder */}
                    <div className="h-32 bg-gradient-to-t from-[#5DBEBB]/20 to-transparent rounded-lg flex items-end justify-center gap-1 p-2">
                      {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                        <div
                          key={i}
                          className="w-4 bg-gradient-to-t from-[#5DBEBB] to-[#5DBEBB]/50 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    {/* List placeholder */}
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="h-8 bg-gray-50 rounded flex items-center px-2 gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-[#7E84C0]/20" />
                          <div className="flex-1 h-2 bg-gray-200 rounded" />
                          <div className="w-12 h-4 bg-[#5DBEBB]/20 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#5DBEBB]/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#7E84C0]/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
