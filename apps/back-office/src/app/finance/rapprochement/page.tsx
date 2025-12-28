import { redirect } from 'next/navigation';

/**
 * Page obsolète - redirige vers la page Transactions unifiée
 * Les fonctionnalités rapprochement sont intégrées dans /finance/transactions
 */
export default function RapprochementPage() {
  redirect('/finance/transactions');
}
