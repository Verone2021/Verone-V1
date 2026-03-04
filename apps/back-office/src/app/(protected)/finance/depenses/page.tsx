import { redirect } from 'next/navigation';

/**
 * Depenses fusionnees dans Transactions (/finance/transactions).
 * La page /finance/depenses/regles reste accessible.
 */
export default function DepensesRedirect() {
  redirect('/finance/transactions');
}
