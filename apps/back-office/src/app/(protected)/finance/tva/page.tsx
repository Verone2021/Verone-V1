import { redirect } from 'next/navigation';

/**
 * TVA deplacee vers /finance/documents/tva
 */
export default function TvaRedirect() {
  redirect('/finance/documents/tva');
}
