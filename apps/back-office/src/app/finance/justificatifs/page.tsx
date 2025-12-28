import { redirect } from 'next/navigation';

/**
 * Page obsolète - redirige vers la page Transactions unifiée
 * Les fonctionnalités justificatifs sont intégrées dans /finance/transactions
 */
export default function JustificatifsPage() {
  redirect('/finance/transactions');
}
