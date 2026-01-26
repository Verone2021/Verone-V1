import { redirect } from 'next/navigation';

/**
 * Redirect /tresorerie to /finance/tresorerie
 *
 * Trésorerie is now integrated into the Finance section.
 * This redirect ensures backward compatibility for bookmarked URLs.
 *
 * @see apps/back-office/src/app/(protected)/finance/tresorerie/page.tsx
 */
export default function TresorerieRedirectPage() {
  redirect('/finance/tresorerie');
}
