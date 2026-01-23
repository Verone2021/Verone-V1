import { redirect } from 'next/navigation';

/**
 * Redirect /avoirs to /factures (Avoirs tab)
 *
 * Avoirs (Credit Notes) functionality is integrated into /factures as a tab.
 * This redirect ensures backward compatibility for bookmarked URLs.
 *
 * @see apps/back-office/src/app/(protected)/factures/page.tsx
 */
export default function AvoirsRedirectPage() {
  redirect('/factures');
}
