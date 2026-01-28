import { redirect } from 'next/navigation';

/**
 * Redirect /devis to /factures (Devis tab)
 *
 * Devis functionality is integrated into /factures as a tab.
 * This redirect ensures backward compatibility for bookmarked URLs.
 *
 * @see apps/back-office/src/app/(protected)/factures/page.tsx
 */
export default function DevisRedirectPage() {
  redirect('/factures');
}
