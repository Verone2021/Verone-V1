import { redirect } from 'next/navigation';

// Redirection permanente : /statistiques/produits → /statistiques?tab=produits
export default function StatsProdRedirect(): never {
  redirect('/statistiques?tab=produits');
}
