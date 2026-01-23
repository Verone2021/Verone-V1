/**
 * ChannelTabs Component
 * Horizontal tab navigation for sales channels (LinkMe, Site Internet, Google Merchant)
 *
 * Features:
 * - Contextual tabs (only displays when in a sales channel)
 * - Breadcrumbs with back button to channels hub
 * - Active tab highlighting with bottom border
 * - Horizontal scroll on mobile
 *
 * Replaces the double sidebar pattern (LinkMeSidebar) with modern tabs navigation
 *
 * @see /Users/romeodossantos/.claude/plans/greedy-chasing-hinton.md
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@verone/utils'

interface Tab {
  label: string
  href: string
}

/**
 * Tab configuration per sales channel
 * Each channel can have different navigation tabs
 */
const CHANNEL_TABS: Record<string, Tab[]> = {
  linkme: [
    { label: 'Dashboard', href: '/canaux-vente/linkme' },
    { label: 'Utilisateurs', href: '/canaux-vente/linkme/utilisateurs' },
    { label: 'Enseignes', href: '/canaux-vente/linkme/enseignes' },
    { label: 'Organisations', href: '/canaux-vente/linkme/organisations' },
    { label: 'Catalogue', href: '/canaux-vente/linkme/catalogue' },
    { label: 'Sélections', href: '/canaux-vente/linkme/selections' },
    { label: 'Commandes', href: '/canaux-vente/linkme/commandes' },
    { label: 'À traiter', href: '/canaux-vente/linkme/commandes/a-traiter' },
    { label: 'Commissions', href: '/canaux-vente/linkme/commissions' },
    { label: 'Configuration', href: '/canaux-vente/linkme/configuration' },
  ],
  'site-internet': [
    { label: 'Dashboard', href: '/canaux-vente/site-internet' },
    { label: 'Produits', href: '/canaux-vente/site-internet/produits' },
    { label: 'Commandes', href: '/canaux-vente/site-internet/commandes' },
  ],
  'google-merchant': [
    { label: 'Dashboard', href: '/canaux-vente/google-merchant' },
    { label: 'Flux', href: '/canaux-vente/google-merchant/flux' },
    { label: 'Synchronisation', href: '/canaux-vente/google-merchant/sync' },
  ],
}

/**
 * Channel display names for breadcrumbs
 */
const CHANNEL_NAMES: Record<string, string> = {
  linkme: 'LinkMe',
  'site-internet': 'Site Internet',
  'google-merchant': 'Google Merchant',
}

/**
 * ChannelTabs - Horizontal tab navigation for sales channels
 *
 * Only renders when user is inside a sales channel (/canaux-vente/*)
 * Includes breadcrumbs and back button for easy navigation
 */
export function ChannelTabs() {
  const pathname = usePathname()

  // Detect which channel is active
  let activeChannel: string | null = null
  let tabs: Tab[] = []

  if (pathname.startsWith('/canaux-vente/linkme')) {
    activeChannel = 'linkme'
    tabs = CHANNEL_TABS.linkme
  } else if (pathname.startsWith('/canaux-vente/site-internet')) {
    activeChannel = 'site-internet'
    tabs = CHANNEL_TABS['site-internet']
  } else if (pathname.startsWith('/canaux-vente/google-merchant')) {
    activeChannel = 'google-merchant'
    tabs = CHANNEL_TABS['google-merchant']
  }

  // Only render tabs if user is in a sales channel
  if (!activeChannel) return null

  const channelName = CHANNEL_NAMES[activeChannel]

  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="container mx-auto px-6">
        {/* Breadcrumbs + Back Button */}
        <div className="flex items-center gap-2 py-2 text-sm text-neutral-600">
          <Link
            href="/canaux-vente"
            className="hover:text-neutral-900 transition-colors"
          >
            ← Retour aux Canaux
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">{channelName}</span>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-8 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'py-3 border-b-2 transition-colors whitespace-nowrap text-sm',
                  isActive
                    ? 'border-black text-black font-medium'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
