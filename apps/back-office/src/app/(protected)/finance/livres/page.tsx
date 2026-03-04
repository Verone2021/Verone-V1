import { redirect } from 'next/navigation';

/**
 * Livres comptables deplacees vers /finance/documents (hub cartes).
 * Les 4 onglets sont maintenant des pages separees :
 * - /finance/documents/resultats
 * - /finance/documents/recettes
 * - /finance/documents/achats
 * - /finance/documents/compte-resultat
 */
export default function LivresRedirect() {
  redirect('/finance/documents');
}
