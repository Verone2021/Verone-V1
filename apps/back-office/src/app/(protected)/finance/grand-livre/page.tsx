import { redirect } from 'next/navigation';

/**
 * Grand Livre deplace vers /finance/documents/grand-livre
 */
export default function GrandLivreRedirect() {
  redirect('/finance/documents/grand-livre');
}
