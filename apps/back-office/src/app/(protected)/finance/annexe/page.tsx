import { redirect } from 'next/navigation';

/**
 * Annexe deplacee vers /finance/documents/annexe
 */
export default function AnnexeRedirect() {
  redirect('/finance/documents/annexe');
}
