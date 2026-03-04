import { redirect } from 'next/navigation';

/**
 * Bilan deplace vers /finance/documents/bilan
 */
export default function BilanRedirect() {
  redirect('/finance/documents/bilan');
}
